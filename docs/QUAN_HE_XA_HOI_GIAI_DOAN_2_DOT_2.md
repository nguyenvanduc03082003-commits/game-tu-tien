# Quan hệ xã hội — Giai đoạn 2, đợt 2

Ngày thực hiện: 30-09-2026.

## Phạm vi đã triển khai

- Ledger cooldown riêng trên SocialRelationshipComponent, không cần tạo RelationshipRecord chỉ để lưu khóa.
- Cổng giao tiếp chung cho AI, proximity và giao lưu cộng đồng.
- Cooldown chữa thương và chỉ điểm, chỉ ghi khóa sau hoạt động thành công.
- Schema cooldown phiên bản 1, serialization/hydration/validation trước staging commit.
- Dọn khóa hết hạn và reset timer quét khi đổi thế giới.

## Quy tắc gameplay hiện áp dụng

| Kênh | Cooldown | Thời gian tương đương ở 1x |
|---|---:|---:|
| communication | 1 ngày | 20 giây |
| healing | 3 ngày | 60 giây |
| teaching | 10 ngày | 200 giây |

- Mỗi cặp dùng chung một khóa không có hướng cho mỗi kênh; đảo vai A/B không mở thêm lượt.
- AI chủ động, gặp gỡ tự nhiên và giao lưu cộng đồng cùng dùng communication. Nguồn thực hiện thành công trước quyết định điểm nhận được; các nguồn sau trong cửa sổ không cộng tiếp.
- Điểm và số lần tương tác chỉ tăng khi performed. Nhãn mỗi phía được xét riêng sau tăng điểm.
- Khi giao tiếp proximity bị khóa, không ghi thêm ký ức trò chuyện hoặc phát lời thoại thành công từ nhánh đó.
- AI bị khóa điểm vẫn hoàn thành hoạt động nghỉ/giao tiếp và hồi recreation theo logic hiện có. Chọn đối tượng theo cooldown thuộc đợt 3.
- Chữa thương bị khóa không gọi consumePill, không hồi HP, không cộng điểm, không thêm ký ức hoặc lời thoại chữa thành công. Tiêu đan không thành công không ghi khóa.
- Chỉ điểm bị khóa không thử RNG chỉ điểm, không tăng masteryExp và không phát lời thoại chỉ điểm.
- Chữa thương/chỉ điểm/giao tiếp có kênh riêng; thực hiện một hoạt động không tự khóa hoạt động khác.
- Hết hạn đúng lúc now >= expiresAtDay thì được phép tương tác tiếp.

## Clock và dữ liệu

- Đọc ngày liên tục từ world.calendarDaysAtTick(), dùng timeState/getCurrentTick của world và cơ chế lịch cũ có sẵn.
- Không dùng Date.now hoặc đếm giây thực cho cooldown. 400 ticks/ngày, 20 ticks/giây = 20 giây/ngày ở 1x.
- Ledger lưu trên component của nhân vật có ID nhỏ hơn với các kênh cặp. Không có singleton hoặc Map toàn cục dùng chung thế giới.
- Kênh có hướng đã có cấu trúc sẵn cho attackedScores, witnessedScores và combatMemory, nhưng chưa được nối vào combat ở đợt này.
- bondAttempt đã có cấu trúc/cấu hình nhưng chưa được nối vào lần thử tạo ràng buộc. Giới hạn lần thử thuộc đợt 3.
- Khóa có targetEntityId, channel, expiresAtDay. Key trong Map được dựng bằng helper thống nhất.
- Quét xã hội định kỳ dọn khóa expiresAtDay <= now. Khi xuất save chỉ lấy khóa chưa hết hạn, sao chép bản ghi.

## Save/load và reset

Schema mới trong social:

```json
{
  "relationships": [],
  "cooldowns": {
    "schemaVersion": 1,
    "entries": [
      { "targetEntityId": 12, "channel": "communication", "expiresAtDay": 8.5 }
    ]
  }
}
```

- Validator kiểm tra object/mảng, schemaVersion, channel, ID nguyên dương an toàn, không self, hạn hữu hạn không âm và key không trùng.
- Kênh không có hướng phải được lưu ở ID nhỏ hơn. Kênh có hướng lưu trên người nhận tác động.
- Cho phép target lịch sử không còn tồn tại; khóa tự hết hạn.
- Save cũ thiếu cooldowns khởi tạo ledger rỗng; không thay đổi các quan hệ/ký ức cũ.
- Hydration sao chép bản ghi và dọn khóa đã hết hạn theo thời gian stagingWorld. Khóa còn hạn giữ nguyên mốc, không đặt lại thời gian chờ.
- Engine.resetWorldState và đường fallback load gọi SocialInteractionSystem.reset để xóa timer quét; ledger đi cùng entity/component nên thế giới mới không dùng dữ liệu khóa thế giới cũ.

## Tệp mã nguồn

| Tệp | Thay đổi |
|---|---|
| `src/modules/social/SocialCooldown.ts` (mới) | Kiểu dữ liệu, channel, owner và key |
| `src/modules/social/SocialInteractionService.ts` (mới) | Đọc thời gian còn lại, kiểm tra/ghi cooldown, giao tiếp hai phía |
| `src/modules/social/SocialComponents.ts` | Ledger, constructor sao chép và prune |
| `src/modules/social/SocialInteractionSystem.ts` | Nối giao tiếp/chữa thương/chỉ điểm, dọn ledger, reset timer |
| `src/modules/ai/brain/behavior/BehaviorTree.ts` | Nối giao tiếp chủ động vào cổng chung |
| `src/modules/factions/FactionSystem.ts` | Nối giao lưu cộng đồng vào cổng chung |
| `src/modules/social/SocialSaveCodec.ts` | Serialize khóa chưa hết hạn và validate schema |
| `src/modules/save/SaveManager.ts` | Xuất/khôi phục ledger, reset fallback |
| `src/core/Engine.ts` | Reset hệ thống xã hội khi đổi thế giới |

## Mức kiểm tra

- Build TypeScript/Vite thành công sau khi bỏ import không còn dùng; còn cảnh báo kích thước bundle > 500 kB.
- Diff check các tệp mã nguồn liên quan không báo lỗi khoảng trắng.
- Đã đọc các đường ghi để xác nhận giao tiếp AI/proximity/cộng đồng gọi cùng service.
- Không thêm/chạy test tự động; chưa kiểm tra trình duyệt, round trip save/load, pause/tăng tốc hoặc các biên cooldown bằng thực nghiệm. Kết luận hành vi trên mô tả logic đã viết, chưa phải bằng chứng nghiệm thu gameplay.

## Công việc còn lại

Đợt 3: khóa lần thử ràng buộc, lựa chọn kết nghĩa, AI xét cooldown khi tìm đối tượng, chống lặp điểm/ký ức combat và thống nhất kiểm tra bán kính.

Đợt 4: Inspector giải thích điều kiện/cooldown, nhật ký và nghiệm thu theo kế hoạch.
