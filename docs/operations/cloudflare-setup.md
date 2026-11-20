# Thiết lập Cloudflare cho blog — runbook cho chủ blog

> Tài liệu này viết bằng tiếng Việt vì đây là runbook vận hành cho chủ blog; phần còn lại của
> `docs/` là tiếng Anh. Lệnh và nhãn trên dashboard giữ nguyên tiếng Anh để copy-paste được.
>
> Đây là các bước **một lần** cho lần deploy đầu. Sau đó mọi lần phát hành chỉ là merge vào `main`
> hoặc `gh workflow run deploy-edge.yml`.

## 0. Chuẩn bị

| Thứ cần có                    | Ghi chú                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------- |
| Tài khoản Cloudflare          | Gói Free là đủ (xem mục 9 về hạn mức)                                            |
| Domain đã thêm vào Cloudflare | Zone phải **Active** — nameserver của domain đã trỏ về Cloudflare                |
| Repo trên GitHub              | Workflow `deploy-edge.yml` nằm trong repo này                                    |
| Quyền admin                   | Cần quyền tạo API token trên Cloudflare và sửa Settings/Environments trên GitHub |

Kiểm tra nhanh zone đã active chưa: dashboard → chọn domain → trang **Overview** ghi "Active".
Nếu chưa, làm theo hướng dẫn đổi nameserver của Cloudflare trước, việc này có thể mất vài giờ.

## 1. Lấy Account ID

Mở [dash.cloudflare.com](https://dash.cloudflare.com), nhìn URL sau khi đăng nhập:

```text
https://dash.cloudflare.com/<ACCOUNT_ID>/workers-and-pages
```

Chuỗi hex 32 ký tự đó là Account ID. (Hoặc **Workers & Pages** → cột phải có dòng "Account ID".)

## 2. Tạo API token

1. Dashboard → **My Profile** → **API Tokens** → **Create Token**.
2. Chọn template **Edit Cloudflare Workers**.
3. **Account resources**: chỉ account của bạn.
4. **Zone resources**: chỉ domain của bạn (ví dụ `example.com`).
5. **Create token**, copy ngay — token chỉ hiện một lần.

Token này cho phép deploy Worker và tạo custom domain. Không commit nó vào repo; nó chỉ sống trong
GitHub Environment secret ở bước 4.

Nếu muốn tự cấu hình thay vì dùng template, tối thiểu cần:

| Nhóm quyền                | Quyền | Dùng cho                     |
| ------------------------- | ----- | ---------------------------- |
| Account · Workers Scripts | Edit  | upload Worker + assets       |
| Zone · Workers Routes     | Edit  | tạo custom domain            |
| Zone · Zone               | Read  | xác thực zone khi gắn domain |

## 3. (Tuỳ chọn) Đăng nhập CLI ở máy

CLI `cf` đã là dependency của `apps/edge`, không cần cài global.

```bash
cd apps/edge
pnpm exec cf auth login     # mở trình duyệt, đăng nhập Cloudflare
pnpm exec cf auth whoami    # xem đang đăng nhập bằng gì
```

Nếu không muốn login tương tác, export token cho shell đang dùng:

```bash
export CLOUDFLARE_API_TOKEN="<token ở bước 2>"
export CLOUDFLARE_ACCOUNT_ID="<account id ở bước 1>"
```

`cf` đọc `CLOUDFLARE_API_TOKEN` trước, rồi mới tới profile đăng nhập.

## 4. Cấu hình GitHub Environment `production-edge`

Workflow chỉ deploy production sau khi environment này được duyệt.

1. Repo → **Settings** → **Environments** → **New environment** → tên `production-edge`.
2. **Deployment branches**: chọn **Selected branches** → chỉ `main`.
3. **Required reviewers**: thêm chính bạn (bắt buộc, đây là cổng duyệt deploy).

Sau đó đặt biến và secret bằng `gh` (chạy ở thư mục repo):

```bash
# Account ID (không phải secret, chỉ là định danh)
gh variable set CLOUDFLARE_ACCOUNT_ID --env production-edge --body "<account-id>"

# Domain và origin canonical — hai giá trị này phải khớp nhau
gh variable set SITE_DOMAIN      --env production-edge --body "blog.example.com"
gh variable set PUBLIC_SITE_URL  --env production-edge --body "https://blog.example.com"

# Token: secret, không phải variable
gh secret set CLOUDFLARE_API_TOKEN --env production-edge
# (dán token khi được hỏi)

# Tuỳ chọn: Web Analytics (xem bước 8)
gh variable set PUBLIC_ANALYTICS_TOKEN --env production-edge --body "<analytics-token>"

# Tuỳ chọn: Vercel Remote Cache
gh variable set TURBO_TEAM --env production-edge --body "<team>"
gh secret   set TURBO_TOKEN --env production-edge
```

Kiểm tra lại:

```bash
gh variable list --env production-edge
gh secret   list --env production-edge
```

## 5. Build và kiểm tra ở máy (không upload)

Bước này chứng minh artefact đúng **trước khi** chạm vào Cloudflare.

```bash
cd /Volumes/Storage/practice/my-blog
export PUBLIC_SITE_URL="https://blog.example.com"
export SITE_DOMAIN="blog.example.com"
export CLOUDFLARE_ACCOUNT_ID="<account-id>"

pnpm turbo run build --filter=@blog/web        # sinh apps/web/dist + OG cards + Pagefind
cd apps/edge
pnpm exec cf build --mode production           # đóng gói dist thành Build Output
pnpm exec cf deploy --prebuilt --mode production --dry-run
```

Kỳ vọng: cả ba lệnh exit 0, và dòng cuối là `--dry-run: exiting now.` Dry-run không gọi API, không
cần token, không upload.

Kiểm tra artefact mang đúng origin:

```bash
cd /Volumes/Storage/practice/my-blog
rg -o 'https://[a-z0-9.-]+' apps/web/dist/vi/index.html | sort -u | head
# phải thấy https://blog.example.com, không có example.com
```

## 6. Deploy preview trước (khuyến nghị)

Preview chạy trên `workers.dev`, không chiếm domain thật.

```bash
cd /Volumes/Storage/practice/my-blog
export PUBLIC_SITE_URL="https://blog.example.com"   # canonical production, để nội dung giống bản thật
pnpm turbo run build --filter=@blog/web

cd apps/edge
export CLOUDFLARE_API_TOKEN="<token>"
export CLOUDFLARE_ACCOUNT_ID="<account-id>"
unset SITE_DOMAIN                                   # preview KHÔNG được claim domain thật
pnpm exec cf build --mode staging
pnpm exec cf deploy --prebuilt --mode staging
```

Vì bản preview build với canonical production, smoke set cần tham số thứ hai là origin canonical
(bước dưới) — nếu không nó sẽ báo sai ở hai kiểm tra canonical/feed.

Lần deploy đầu, Cloudflare sẽ hỏi/tạo **workers.dev subdomain** cho account nếu chưa có — đặt một
tên (ví dụ `chuquanpho29`). URL của bản preview có dạng:

```text
https://blog-edge-staging.<subdomain>.workers.dev
```

CLI thường in URL này khi deploy xong; nếu không thấy, mở dashboard → **Workers & Pages** →
`blog-edge-staging` → mục **Domains** để lấy đúng hostname.

Kiểm tra bằng smoke set (tham số thứ hai là origin canonical đã build vào HTML):

```bash
cd /Volumes/Storage/practice/my-blog
./scripts/smoke-static.sh https://blog-edge-staging.<subdomain>.workers.dev https://blog.example.com
```

Kỳ vọng: `all checks passed` (23 kiểm tra: routes, feeds, sitemap, robots, Pagefind, 404, headers,
canonical). Nếu fail, xem mục 11.

## 7. Deploy production qua GitHub Actions

Không deploy production bằng tay từ máy — workflow mới có cổng duyệt và secret đúng phạm vi.

Cách A — merge một PR vào `main` (workflow tự chạy nếu có file trong `apps/**`, `packages/**`,
lockfile hoặc `turbo.json` thay đổi).

Cách B — chạy tay:

```bash
gh workflow run deploy-edge.yml --ref main
gh run watch "$(gh run list --workflow deploy-edge.yml --limit 1 --json databaseId -q '.[0].databaseId')"
```

Vào tab **Actions** → run `deploy-edge` → job `deploy (production-edge)` đang chờ → **Review
deployments** → approve.

Sau khi job xanh, chạy lại smoke set trên domain thật:

```bash
cd /Volumes/Storage/practice/my-blog
./scripts/smoke-static.sh https://blog.example.com
```

## 8. Custom domain — cơ chế và kiểm tra

`apps/edge/cloudflare.config.ts` chỉ khai báo `domains: [SITE_DOMAIN]` khi mode là `production` **và**
`SITE_DOMAIN` có giá trị. Khi deploy, Cloudflare tự:

- tạo bản ghi DNS trỏ hostname vào Worker,
- cấp chứng chỉ (Advanced Certificate) cho hostname đó.

Điều kiện và cạm bẫy:

- Hostname phải nằm trong zone **cùng account**, và **không được có sẵn bản ghi CNAME** cùng tên.
- Khớp chính xác: Worker gắn `example.com` **không** nhận `www.example.com`. Nếu cần `www`, tạo
  Redirect Rule `www` → apex (Cloudflare → Rules → Redirect Rules).
- Xoá custom domain **không** tự xoá certificate; dọn tay ở **SSL/TLS → Edge Certificates**.

Kiểm tra:

```bash
curl -sI https://blog.example.com/vi/ | head -5          # 200 + headers
curl -s  https://blog.example.com/vi/rss.xml | head -5    # feed đúng origin
```

## 9. Web Analytics

Có **hai cách**, chọn một — đừng bật cả hai (sẽ thành 2 snippet trên một trang):

**Cách A — automatic setup (zone proxied qua Cloudflare).** Dashboard → **Web Analytics** →
**Add a site** → chọn hostname. Cloudflare tự chèn beacon, không cần gì trong repo. Khi dùng cách này
thì **để trống** `PUBLIC_ANALYTICS_TOKEN`.

**Cách B — manual (khuyến nghị khi muốn kiểm soát trong repo).** Dashboard → **Web Analytics** →
**Add a site** → nhập hostname → **Manage site** → copy token → đặt biến:

```bash
gh variable set PUBLIC_ANALYTICS_TOKEN --env production-edge --body "<token>"
```

Build production chỉ chèn beacon khi biến này có giá trị; build dev và build không token thì không
chèn gì.

Kiểm tra sau khi deploy: mở site → DevTools → **Network** → lọc `cloudflareinsights`:

| Request                                                   | Kỳ vọng trên domain thật   |
| --------------------------------------------------------- | -------------------------- |
| `GET https://static.cloudflareinsights.com/beacon.min.js` | 200                        |
| `POST https://cloudflareinsights.com/cdn-cgi/rum`         | 200 (204 cũng bình thường) |

Dữ liệu xuất hiện trong dashboard sau vài phút. Nếu dùng CSP sau này, cần thêm
`script-src https://static.cloudflareinsights.com/beacon.min.js` và
`connect-src https://cloudflareinsights.com`.

**Chi phí và hạn mức (Free plan):** 100.000 request/ngày cho Worker, 10 ms CPU mỗi lần gọi.
Lưu ý: `runWorkerFirst: ["/*"]` khiến **mọi** request đều chạy Worker (để gắn security headers), nên
mọi request tính vào hạn mức này — không thuộc diện "static assets miễn phí không giới hạn". Với blog
cá nhân, 100k/ngày là rất rộng; nếu vượt, request nhận 429 chứ không tự fallback về asset. Muốn bỏ
giới hạn đó thì phải trả $5/tháng (Workers Paid) hoặc thu hẹp `runWorkerFirst` (mất headers ở một số
đường dẫn).

## 10. Kiểm tra tổng thể sau khi lên

```bash
cd /Volumes/Storage/practice/my-blog

# 1) Toàn bộ bề mặt đọc + headers + canonical + 404
./scripts/smoke-static.sh https://blog.example.com

# 2) Vài đường dẫn quan trọng
for p in /vi/ /en/ /vi/posts/ /vi/rss.xml /en/feed.json /sitemap-index.xml /robots.txt; do
  printf '%-22s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://blog.example.com$p"
done

# 3) Headers bảo mật
curl -sI https://blog.example.com/vi/ | grep -Ei 'strict-transport|x-content-type|x-frame|referrer|permissions'
```

Trong trình duyệt, kiểm thêm: gõ thử một từ khoá ở `/vi/search/`, mở một bài, chuyển EN/VI, bật/tắt
dark mode, và mở một URL không tồn tại (phải ra trang 404 của blog, không phải trang của Cloudflare).

## 11. Xử lý sự cố

| Triệu chứng                                                                                      | Nguyên nhân thường gặp                                                                  | Cách xử lý                                                             |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `401`/`403` khi deploy                                                                           | Token thiếu quyền hoặc sai account                                                      | Tạo lại token theo bước 2; kiểm tra `CLOUDFLARE_ACCOUNT_ID`            |
| `The Build Output was created with mode "staging", but this command requested mode "production"` | Build và deploy khác `--mode`                                                           | Build lại đúng mode: `cf build --mode production` rồi deploy cùng mode |
| Job `deploy` không chạy                                                                          | `changes` filter không thấy file trong `apps/**`, `packages/**`, lockfile, `turbo.json` | `gh workflow run deploy-edge.yml --ref main`                           |
| Deploy xong nhưng domain vẫn trỏ chỗ khác                                                        | `SITE_DOMAIN` chưa set ở bước build, hoặc đã có CNAME cùng tên                          | Set biến, xoá CNAME cũ, deploy lại                                     |
| Mọi trang trả 404                                                                                | `apps/web/dist` rỗng — build web chưa chạy                                              | `pnpm turbo run build --filter=@blog/web` trước khi `cf build`         |
| Canonical vẫn `example.com`                                                                      | Thiếu `PUBLIC_SITE_URL` ở bước build                                                    | Set biến (bước 4) rồi deploy lại                                       |
| Trang cũ vẫn hiện sau deploy                                                                     | CDN cache / DNS cache                                                                   | Kiểm tra bằng nội dung trả về, thử thêm `?v=2`; chờ vài phút           |
| Analytics không có dữ liệu                                                                       | Adblock; hostname không khớp site đã đăng ký; bật cả auto + manual                      | Tắt adblock, kiểm tra hostname, chỉ dùng một cách ở bước 9             |
| `429` khi traffic tăng                                                                           | Vượt 100k request/ngày của Worker Free                                                  | Chờ reset 00:00 UTC, hoặc Workers Paid $5/tháng                        |

## 12. Rollback

Deploy lại commit tốt trước đó — asset tĩnh nên không có dữ liệu phải khôi phục:

```bash
git log --oneline -10                     # tìm commit tốt
gh workflow run deploy-edge.yml --ref <commit-tot>
```

Hoặc revert commit xấu rồi merge vào `main`. Đừng chỉ đổi version Worker trên dashboard: làm vậy dễ
ghép asset mới với script cũ.

## 13. Checklist lần đầu

- [ ] Zone của domain đang **Active** trên Cloudflare
- [ ] Đã lấy Account ID (bước 1)
- [ ] Đã tạo API token và lưu an toàn (bước 2)
- [ ] Environment `production-edge` có reviewer + chỉ branch `main` (bước 4)
- [ ] Đã set `CLOUDFLARE_ACCOUNT_ID`, `SITE_DOMAIN`, `PUBLIC_SITE_URL`, secret `CLOUDFLARE_API_TOKEN`
- [ ] `cf deploy --prebuilt --mode production --dry-run` exit 0 ở máy (bước 5)
- [ ] Preview `--mode staging` chạy smoke 23/23 (bước 6)
- [ ] Production deploy qua Actions và được duyệt (bước 7)
- [ ] `scripts/smoke-static.sh https://<domain>` pass (bước 10)
- [ ] Analytics: chọn một cách, dữ liệu bắt đầu lên (bước 9)
- [ ] `docs/status.md` đóng P0-4 với bằng chứng deploy

## 14. Tham chiếu

- Biến môi trường: [`../development/environment-variables.md`](../development/environment-variables.md)
- Pipeline và cách chạy tay: [`ci-cd-pipeline.md`](ci-cd-pipeline.md) §3–§5
- Rollback và khôi phục: [`disaster-recovery.md`](disaster-recovery.md)
- Custom domain (Cloudflare docs): <https://developers.cloudflare.com/workers/configuration/routing/custom-domains/>
- API token cho CI: <https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/>
- Web Analytics: <https://developers.cloudflare.com/web-analytics/get-started/>
- Giá và hạn mức Workers: <https://developers.cloudflare.com/workers/platform/pricing/>
