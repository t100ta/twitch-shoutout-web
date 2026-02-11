# tmi.js カスタム改造について

## 結論
現状の実装では **tmi.js のローカル改造は不要** です。

## 背景
過去は `raided` イベントから **loginName** を取得するために tmi.js を改造していました。
しかし、現在は Twitch IRC の `USERNOTICE`（`msg-id=raid`）に **`msg-param-login`** が含まれており、
`usernotice` 経由で **loginName を取得可能** です。

## 現行方針
- `tmi.js` は **npm 版（^1.8.5）** を利用
- Raid 検知は `usernotice` の tags を参照
- `display-name` は日本語など非ASCIIになり得るため、**loginName** を識別用に利用

## 実装箇所
- `src/components/Home.tsx`  
  - `tags["msg-param-login"]` を利用
  - `tags["msg-param-displayName"]` を表示名として利用
