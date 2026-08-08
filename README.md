# 坤坤时钟

页面与 API 使用同一个域名：

- 页面：`https://kun.py.kg/`
- 当前坤历：`https://kun.py.kg/now`

## Cloudflare Pages 部署

1. 把这个目录推送到 GitHub。
2. 在 Cloudflare 的 Workers & Pages 中创建 Pages 项目并连接该仓库。
3. 构建命令留空，输出目录填写 `/`。
4. 部署成功后，在 Pages 项目的 Custom domains 中添加 `kun.py.kg`。
5. 按 Cloudflare 提示，在 nic.py.kg 添加 CNAME，目标指向项目的 `*.pages.dev` 域名。

`_worker.js` 会处理 `/now`，其他请求会继续交给 Pages 的静态资源服务。页面启动后会调用 `/now` 校时，并每分钟重新同步一次。
