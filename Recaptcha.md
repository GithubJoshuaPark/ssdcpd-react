# MFA Enrollment Flow with Recaptcha

이 다이어그램은 `ProfileModal.tsx`에서 구현된 전화번호 기반의 2단계 인증(MFA) 등록 및 Recaptcha 검증 과정을 보여줍니다.

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자 (User)
    participant Component as ProfileModal (React)
    participant UseAuth as useAuth (Hook)
    participant Firebase as Firebase Auth SDK
    participant SMS as SMS Provider

    Note over User, Component: 1. 전화번호 입력 단계

    User->>Component: 전화번호 입력 후 "Send Code" 클릭
    Component->>Component: handleSendMfaCode() 실행

    Component->>UseAuth: sendMfaEnrollmentCode(phoneNumber, "recaptcha-container")

    UseAuth->>Firebase: RecaptchaVerifier 생성 & 렌더링
    Firebase-->>User: Recaptcha 챌린지 표시 (I'm not a robot)

    User->>Firebase: Recaptcha 챌린지 수행 및 완료

    Note over Firebase: Recaptcha 검증 성공 시

    Firebase->>SMS: 인증번호(SMS) 발송 요청
    SMS-->>User: SMS 수신 (인증코드 6자리)

    Firebase-->>UseAuth: verificationId 반환
    UseAuth-->>Component: verificationId, verifier 인스턴스 반환

    Component->>Component: setMfaVerificationId(id)<br/>setMfaStep("verifying")
    Component-->>User: 인증코드 입력 UI 표시

    Note over User, Component: 2. 인증코드 확인 단계

    User->>Component: SMS 인증코드 입력 후 "Verify" 클릭
    Component->>Component: handleEnrollMfa() 실행

    Component->>UseAuth: finalizeMfaEnrollment(verificationId, code)

    UseAuth->>Firebase: PhoneMultiFactorGenerator.assertion(cred)
    UseAuth->>Firebase: user.multiFactor.enroll(assertion)

    Firebase-->>UseAuth: 등록 성공 응답
    UseAuth-->>Component: 성공 반환

    Component->>Component: setMfaStep("idle")<br/>Toast("2FA Enabled successfully")
    Component-->>User: "Enabled checking" 상태 표시
```

## 주요 단계 설명

1.  **초기화 및 요청**: 사용자가 전화번호를 입력하고 요청하면 `recpatcha-container` ID를 가진 DOM 요소에 Firebase의 보이지 않는(invisible) 혹은 보이는 Recaptcha 위젯이 주입됩니다.
2.  **Recaptcha 검증**: Google은 이 요청이 봇이 아님을 확인하기 위해 Recaptcha를 수행합니다. 이 과정이 통과되어야만 SMS가 발송됩니다. (비용 및 스팸 방지)
3.  **인증 및 등록**: 사용자가 받은 SMS 코드를 입력하면, 앞서 받은 `verificationId`와 결합하여 최종적으로 사용자의 계정에 MFA 요소(Phone Info)를 등록합니다.
