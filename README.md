以下是 **繁體中文版 README.md（開源版本）**，已調整為適合 GitHub 專案使用的格式：

---

# Friends Info

一個輕量級平台，用於建立並同步個人網站之間的好友連結。

---

## 專案簡介

Friends Info 讓使用者可以：

* 建立個人資料頁
* 透過雙方同意建立好友關係
* 自動同步好友清單
* 提供公開 API 供外部網站使用

本專案的目標是降低個人網站中「友情連結（Friends / Links）」的維護成本。

---

## 功能特色

### 核心功能

* Email 登入（Magic Link）
* 使用者資料管理
* 好友關係系統（邀請 / 申請）
* Email 同意機制
* 自動同步好友清單
* 提供 Public API

---

### 關係模型

支援兩種關係建立方式：

* **INVITE**：邀請對方加入我的好友清單
* **APPLY**：申請加入對方的好友清單

所有關係都需經過對方同意才會成立。

---

## 技術選型（建議）

* 後端：Node.js / NestJS / Express
* 資料庫：PostgreSQL
* 快取：Redis（用於 Rate Limit）
* Email：SMTP / SendGrid
* 驗證：Magic Link（Token 機制）

---

## 系統架構

### 核心資料表

* `users`
* `friendships`（關係狀態）
* `friend_lists`（顯示層）
* `email_tokens`
* `notifications`

---

此設計可提升系統彈性與擴充性。

---

## API 概覽

### Auth

```
POST /auth/login
GET  /auth/verify
```

---

### 使用者

```
GET   /me
PATCH /me
GET   /users/{slug}
```

---

### 好友關係

```
POST /friendships
GET  /friendships
POST /friendships/{id}/accept
POST /friendships/{id}/reject
```

---

### 好友清單

```
GET   /users/{id}/friends?sort=recent
GET   /users/{id}/friends?sort=custom
PATCH /friends/order
```

---

### 公開 API

```
GET /public/users/{token}
```

範例：

```json
{
  "user_name": "Friends",
  "user_cn_name": "朋友",
  "user_links": "https://example.com/",
  "user_profile": "Bio",
  "user_img": "avatar_url"
}
```

---

## 排序機制

支援兩種排序方式：

* `recent`：依最近加入排序（預設）
* `custom`：自訂排序

SQL 範例：

```sql
ORDER BY 
  order_index IS NULL,
  order_index ASC,
  created_at DESC
```

---

## Rate Limit

公開 API 限制：

* 每 IP：60 requests / minute
* 每 Token：1000 requests / hour

超出限制回應：

```json
{
  "error": "Rate limit exceeded"
}
```

---

## 快速開始

### 1. 下載專案

```bash
git clone https://github.com/your-org/friends-info.git
cd friends-info
```

---

### 2. 安裝套件

```bash
npm install
```

---

### 3. 設定環境變數

```bash
cp .env.example .env
```

範例：

```
DATABASE_URL=postgresql://user:password@localhost:5432/friends
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret
EMAIL_PROVIDER=sendgrid
```

---

### 4. 執行資料庫 Migration

```bash
npm run migrate
```

---

### 5. 啟動服務

```bash
npm run dev
```

---

## 安全性

* Token-based 驗證（Magic Link）
* Email Token 有效期限（建議 24 小時）
* Private 資料存取控制
* Public API Rate Limit 保護

---

## MVP 範圍

### 已包含

* 登入系統（Magic Link）
* 個人資料管理
* 好友邀請 / 申請
* Email 同意流程
* 好友清單顯示
* Public API

---


## 貢獻方式

歡迎提交 Pull Request。

建議流程：

1. Fork 專案
2. 建立功能分支
3. 提交 PR
