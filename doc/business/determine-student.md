# Logic phân loại học sinh theo điểm

## Trường hợp 1:
- tất cả các môn được đánh giá = điểm số phải từ 9 điểm -> 10 điểm
- các môn nhận xét bằng T

-> Hoàn Thành xuất sắc (HTXS)

## Trường hợp 2:
- Tất cả các môn được đánh giá = điểm số từ 9 trở lên
- Môn đánh giá = nhận xét (H, T) thì 1 môn nào đó bị đánh giá là H thì:
    - Môn toán + môn tiếng việt của lớp 3, 4, 5 (2 môn này bắt buộc phải được 10 điểm hết).
    - Riêng tiếng anh từ lớp 3 đến lớp 5 phải từ 9 điểm trở lên.

`*lưu ý: trường hợp này sẽ hiển thị tại phần khen thưởng ở bảng là có thành tích vượt trội (CTTVT)`

## Trường hợp 3:

- Học sinh không đạt điểm 9, 10.
- Nhận xét H hoặc T.
=> nhưng hs đạt giải, huy chương trong các kỳ thi Toán, Tiếng việt, Tiếng Anh cấp: Thành phố, Quốc Gia, Dông Nam Á, Quốc tế, do `Sở Giáo Dục và Đào Tạo Hà Nội` hoặc `Bộ Giáo Dục và Đào Tạo`

## Interface

```ts
export interface TranscriptData {
    ten: string;
    monHoc: Array<{
        mon: string;
        muc: string; // T, H, ...
        diem: number | null;
    }>;
    phamChat?: Record<string, string>;
    nangLuc?: Record<string, string>;
}
```

