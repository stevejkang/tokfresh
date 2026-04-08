[English](./README.md) | 한국어

# TokFresh

Claude 토큰 리셋 타이밍을 자동화하여 최대 효율을 달성하세요.

> [!NOTE]  
> 웹 대신 CLI를 사용할 수 있습니다. 자세한 내용은 [tokfresh-cli](https://github.com/stevejkang/tokfresh-cli)를 참조하세요.

## 기능

Claude Pro/Max 사용량은 첫 API 호출 후 5시간마다 리셋됩니다. TokFresh는 설정한 스케줄에 따라 해당 주기를 사전 트리거하여, 리셋이 업무 시간에 맞춰지도록 합니다.

Cloudflare Worker가 **당신의** 계정에서 cron으로 24시간 실행됩니다. 컴퓨터가 꺼져 있어도 됩니다.

## 설정

1. **Claude 연결** — OAuth, API 키 불필요.
2. **스케줄 설정** — 시작 시간을 선택하면 5시간 간격이 자동 계산됩니다.
3. **배포** — 무료 Cloudflare 계정에 원클릭 배포.

## FAQ

**스케줄은 어떻게 변경하나요?**
셋업을 다시 실행하세요. 같은 워커에 배포되므로 새 배포가 기존 스케줄을 대체합니다. 또는 [Cloudflare Worker 설정](https://dash.cloudflare.com/?to=/:account/workers/services/view/tokfresh-scheduler/production/settings)의 Trigger Events 섹션에서 cron 표현식(UTC)을 직접 수정할 수 있습니다.

**스케줄러를 삭제하려면 어떻게 하나요?**
[Cloudflare Worker 설정](https://dash.cloudflare.com/?to=/:account/workers/services/view/tokfresh-scheduler/production/settings)에서 `tokfresh-scheduler` 워커를 삭제하면 됩니다.

## 개인정보

완전한 무상태(stateless). 토큰은 브라우저에서 교환되어 Cloudflare 계정으로 직접 전송됩니다. 어떤 것도 저장하지 않습니다.
