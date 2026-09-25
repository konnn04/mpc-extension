name: 🐛 Bug Report
description: Report a technical bug in the system
title: "[BUG] - "
labels: ["bug"]
body:
  - type: checkboxes
    id: prerequisites
    attributes:
      label: Prerequisites
      description: Please read the classification guide to identify the bug accurately.
      options:
        - label: I have read the document about [Writing a report](https://notebook.konnn04.dev/docs/kiem-thu-phan-mem/02-viet-bao-cao-loi/01-yeu-cau-bao-cao-loi)
          required: true
        - label: I have read the document about [Preparing attachments](https://notebook.konnn04.dev/docs/kiem-thu-phan-mem/02-viet-bao-cao-loi/02-tep-dinh-kem)
          required: true
        - label: I have read the document about [Functional bugs](https://notebook.konnn04.dev/docs/kiem-thu-phan-mem/03-phan-loai-bug/01-loi-chuc-nang)
          required: true
        - label: I have read the document about [Content bugs](https://notebook.konnn04.dev/docs/kiem-thu-phan-mem/03-phan-loai-bug/02-loi-noi-dung)
          required: true
        - label: I have read the document about [Display bugs](https://notebook.konnn04.dev/docs/kiem-thu-phan-mem/03-phan-loai-bug/03-loi-hien-thi)
          required: true

  - type: dropdown
    id: bug_type
    attributes:
      label: Bug Type
      description: Choose the appropriate classification based on the documents you have read
      options:
        - Visual
        - Content
        - Function
    validations:
      required: true

  - type: input
    id: error_link
    attributes:
      label: Link to the error (if app, version number)
      placeholder: "https://example.com"
    validations:
      required: true

  - type: textarea
    id: reproduction_steps
    attributes:
      label: Steps to reproduce
      placeholder: |
        1. Go to https://example.com/...
        2. Click the button...
        3. See the error appear...
    validations:
      required: true

  - type: textarea
    id: expected_behavior
    attributes:
      label: Expected
      placeholder: How should the system behave?
    validations:
      required: true

  - type: textarea
    id: actual_behavior
    attributes:
      label: Actual
      placeholder: What is the system doing wrong?
    validations:
      required: true

  - type: textarea
    id: environment
    attributes:
      label: Device, browser, environment
      placeholder: |
        - Device: ...
        - Browser: ...
        - Environment: (e.g., Staging / Production)
    validations:
      required: true

  - type: textarea
    id: attachments
    attributes:
      label: Attachments
      placeholder: Drag and drop images or videos illustrating the issue here
