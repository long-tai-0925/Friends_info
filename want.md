---

# Friends Info — 初期功能期望書

---

## 一、產品目標（Product Goal）

打造一個讓使用者能夠：

**快速建立、管理、並自動同步「好友個人頁面連結」的工具**

解決問題：

* 手動維護好友連結成本高
* 無法即時同步資料
* 缺乏雙方同意的關係機制

---

## 二、核心價值（Core Value）

1. 好友連結自動同步（API-based）
2. 雙方同意的關係建立
3. 降低手動維護成本
4. 可嵌入個人網站（Public API）

---

## 三、使用者角色

| 角色    | 說明          |
| ----- | ----------- |
| 註冊使用者 | 建立個人頁面與好友關係 |
| 未登入訪客 | 查看公開資料      |
| 第三方網站 | 使用 API 取得資料 |

---

## 四、核心流程（User Flow）

### 1. 登入流程

* 使用 Email 登入
* Magic Link（主要）
* 驗證碼（備用）

---

### 2. 建立好友關係

#### 情境 A：邀請加入（INVITE）

A 邀請 B 加入 A 的好友清單

流程：

1. A 選擇 B
2. 系統寄送 Email
3. B 同意
4. B 加入 A 清單

---

#### 情境 B：申請加入（APPLY）

A 申請加入 B 的好友清單

流程：

1. A 選擇 B
2. 系統寄送 Email
3. B 同意
4. A 加入 B 清單

---

### 3. 自動同步

* 同意後自動更新
* 透過 API 即時取得資料
* 無需手動更新頁面

---

## 五、功能設計（Functional Requirements）

### 1. 登入系統

登入前：

* Email 輸入
* Magic Link / 驗證碼

---

### 2. 使用者資料

欄位：

* 中文名稱
* 英文名稱
* 個人簡介
* 個人網站
* Email

頭像：

* 圖片上傳
* 可選同步 Gravatar

設定：
* 是否使用 slug（預設英文名稱）

---

### 3. 好友關係管理

功能名稱：建立好友關係

功能內容：

* 顯示已註冊使用者
* 支援多選
* 發送 Email 請求

類型：

| 類型     | 說明         |
| ------ | ---------- |
| INVITE | 邀請對方加入我的頁面 |
| APPLY  | 申請加入對方頁面   |

選項：

* 有新使用者時通知我

---

### 4. 好友清單顯示

* 僅顯示已同意關係
* 顯示於個人頁面

排序：

1. 最近加入（預設）
2. 自訂排序

---

### 5. Public API

#### Endpoint

```
GET /public/users/{token}
```

#### Response

```json
{
  "user_name": "Friends",
  "user_cn_name": "朋友",
  "user_links": "https://example.com/",
  "user_profile": "簡介",
  "user_img": "avatar_url"
}
```

---

## 六、Email 通知設計

### 1. 邀請加入（INVITE）

A（發送者）：

```
您已邀請以下使用者加入好友清單：
{user_list}

邀請已寄出，請耐心等候。
```

B（接收者）：

```
您被邀請加入 {A_user_name} 的好友清單

對方頁面：
{A_user_links}

[同意]

若不想加入，請忽略此信件。
```

---

### 2. 申請加入（APPLY）

A：

```
您已申請加入 {B_user_name} 的好友清單
```

B：

```
{A_user_name} 想加入您的好友清單

對方頁面：
{A_user_links}

[同意]
```

---

### 3. 新使用者通知

```
有新的使用者加入

是否加入好友清單？
[加入]
```

---

### 安全設計

```
https://example.com/action?token=xxx
```

---

## 七、資料結構（概要）

### users

使用者資料

### friendships

關係請求（PENDING / ACCEPTED / REJECTED）

### friend_lists

好友顯示資料

---

## 八、排序機制

最近加入：

```
ORDER BY created_at DESC
```

自訂排序：

```
ORDER BY order_index ASC
```

混合排序（建議）：

```
ORDER BY 
  order_index IS NULL,
  order_index ASC,
  created_at DESC
```

---

## 九、Rate Limit（公開 API）

基本限制：

* 60 requests / minute / IP

進階：

* 1000 requests / hour（token）

超出回應：

```json
{
  "error": "Rate limit exceeded"
}
```

---

## 十、安全與權限

* Private 使用者不可透過 Public API 存取
* 僅關係雙方可操作資料
* Email token 建議有效期限 24 小時

---
