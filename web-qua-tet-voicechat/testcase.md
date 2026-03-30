# Test Cases - 24 Emotions

## Kiến trúc emotion detection

- **AskCommands (LLM)**: Xác định action (8 actions), KHÔNG detect emotion
- **DetectEmotion (Groq LLM)**: Gọi riêng 1 LLM call sau khi có bot response → classify emotion
- **FE**: Xử lý `expecting` (loading) và `default_still` (idle)

## 8 Actions

| Action | Mô tả | Ví dụ |
|--------|-------|-------|
| `start_flow` | Bắt đầu flow | "tham gia ngay" |
| `set_slot` | Set giá trị slot trong flow | "đáp án là lửa" |
| `disambiguate_flows` | Mơ hồ nhiều flow | "tôi cần hỗ trợ" (mơ hồ) |
| `search_and_reply` | Hỏi thông tin, tìm kiếm | "POPTECH là gì" |
| `cancel_flow` | Hủy flow | "hủy bỏ", "không chơi nữa" |
| `clear_slots` | Reset slots | "làm lại từ đầu" |
| `chit_chat` | Chat phím, khen, chào hỏi | "em giỏi quá", "hello" |
| `unclear_input` | Vô nghĩa, khó hiểu | "asdf", "xyz", ký tự ngẫu nhiên |

## Test nhanh (trigger trực tiếp)

| # | Emotion | Tin nhắn test | Action | Kỳ vọng |
|---|---------|--------------|--------|---------|
| 1 | `active` | tham gia ngay | start_flow | Bot chào mừng, bắt đầu game |
| 2 | `happy` | tuyệt vời quá | chit_chat | Bot chat phím vui vẻ |
| 3 | `pleased` | cảm ơn em nhé | chit_chat | Bot: "Dạ không có gì ạ" |
| 4 | `innocent` | tổng thống mỹ là ai | search_and_reply | Bot: "ngoài phạm vi" |
| 5 | `worried` | tệ quá không hài lòng | chit_chat | Bot đồng cảm, xin lỗi |
| 6 | `shocked` | wow thật á | chit_chat | Bot phản ứng bất ngờ |
| 7 | `shy` | em giỏi quá | chit_chat | Bot: "Dạ cảm ơn anh/chị khen ạ" |
| 8 | `impatient` | nhanh lên đi | chit_chat | Bot xin lỗi vì chậm |
| 9 | `questioning` | tôi cần hỗ trợ | disambiguate | Bot hỏi lại cụ thể |
| 10 | `interested` | POPTECH có những giải pháp gì | search_and_reply | Bot giải thích chi tiết |
| 11 | `confident` | POPTECH có phải công ty công nghệ không | search_and_reply | Bot: "chính xác" |
| 12 | `helpless` | cho tôi gặp nhân viên tư vấn | search_and_reply | Bot: "chuyển nhân viên" |
| 13 | `serious` | có lưu ý gì khi sử dụng không | search_and_reply | Bot: "lưu ý", "quan trọng" |
| 14 | `doubting` | POPTECH có chi nhánh ở Hà Nội không | search_and_reply | Bot: "không có thông tin" |
| 15 | `default` | (câu hỏi bình thường, bot trả lời đầy đủ) | search_and_reply | Không có gì đặc biệt |

## Test trong flow game (cần "tham gia ngay" trước)

| # | Emotion | Cách trigger | Action | Ghi chú |
|---|---------|-------------|--------|---------|
| 16 | `proud` | Trả lời đúng câu hỏi game | set_slot | Bot: "Chính xác!", "Bạn đã trả lời đúng" |
| 17 | `aware_L` | Bot nhận thông tin từ user | set_slot | Bot: "em hiểu", "em đã ghi nhận" |
| 18 | `aware_R` | User trả lời slot (nhập tên, SĐT) | set_slot | Bot: "em nắm được" |
| 19 | `singing` | Bot trao quà, chúc mừng lễ hội | — | Bot: "chúc tết", "quà tặng" |
| 20 | `lazy` | User nói "ừ"/"ok" → bot trả lời ngắn | — | Bot response < 15 ký tự |
| 21 | `pretending` | User nói đùa → bot đùa lại | chit_chat | Bot: "haha" |
| 22 | `tired` | Chat liên tục > 10 lượt | — | Conversation length check |

## Test off-topic khi đang trong flow game

| # | Tin nhắn | Action | Kỳ vọng |
|---|----------|--------|---------|
| A | em giỏi quá | chit_chat | Bot chat phím + hỏi "tiếp tục trò chơi không?" |
| B | tổng thống mỹ là ai | search_and_reply | Bot trả lời + hỏi "tiếp tục?" |
| C | asdf | unclear_input | Bot: "Em không hiểu" + hỏi "tiếp tục?" |
| D | nhanh lên đi | [] rỗng → fallback | Bot: "Em chưa hiểu" + hỏi "tiếp tục?" |
| E | tiếp tục | [] rỗng → wantsContinue | Bot tiếp tục câu hỏi game |
| F | ok / ừ / vâng | [] rỗng → wantsContinue | Bot tiếp tục câu hỏi game |
| G | đáp án 1 là lửa | set_slot | Bot xử lý đáp án, tiếp tục game |

## FE tự xử lý (không từ n8n)

| # | Emotion | Khi nào | Ghi chú |
|---|---------|---------|---------|
| 23 | `expecting` | User gửi tin, chờ bot trả lời | FE set khi loading |
| 24 | `default_still` | Không tương tác | FE luân phiên default ↔ default_still mỗi 5s |

## Emotion detection flow

```
User message
    ↓
AskCommands (LLM) → 8 actions (không detect emotion)
    ↓
ParseCommands → xử lý actions, fallback empty actions
    ↓
Pipeline xử lý (RAG, flow, chit_chat, unclear_input...)
    ↓
Repair_Response → tổng hợp bot response text
    ↓
BuildEmotionPrompt → tạo prompt (user msg + bot response + actions)
    ↓
DetectEmotion (Groq llama-3.3-70b) → classify 1/24 emotions
    ↓
MergeEmotion → gán emotion vào response
    ↓
Response: {emotion: "happy", text: "...", ...}
```

## Off-topic handling trong flow

```
User đang trong game → nói off-topic
    ↓
LLM trả chit_chat/unclear_input/search_and_reply/[] rỗng
    ↓
is_search_and_reply = true
    ↓
Bot trả lời (chat phím / search / "em chưa hiểu")
    ↓
CheckHasActiveFlow → có game đang chạy → askContinue = true
    ↓
RepairUtter3 → append "Có muốn tiếp tục trò chơi không?"
    (skip nếu LLM response đã nhắc "tiếp tục")
    ↓
User nhập "tiếp tục"/"ok"/"ừ" → wantsContinue → game tiếp tục
```
