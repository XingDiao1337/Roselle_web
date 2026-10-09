# Roselle Web

React / TypeScript / Vite 前端，包含登录注册、用户概览、头像/用户名/密码设置、硬件绑定重置、卡密激活，以及管理员用户/卡密/DLL发布面板。

```powershell
cd D:\Google\Roselle_web
npm ci
npm run build
.\scripts\start-local.ps1 -SkipBuild
```

访问 http://127.0.0.1:5173 。后端需要运行在127.0.0.1:8080。Vite仅代理/api/web，src/api.ts拒绝其他API前缀，使用HttpOnly Cookie，不存储账号密码或注入器令牌。

管理员使用后端指定的固定账户。完整卡密只在生成时展示，请复制保存。密码修改后重新登录；硬件重置后注入器重新登录。

生产构建在dist，Dockerfile使用Nginx托管，deploy/default.conf.template按Web、注入器和DLL三个域名分流；部署步骤见同级Roselle_server/DEPLOY.md。配置已准备，本次未执行云端容器部署。
