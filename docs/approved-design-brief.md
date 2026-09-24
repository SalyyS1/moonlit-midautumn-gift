# Approved Design Brief — “Đêm trăng chỉ có hai đứa mình”

## Product intent

A personal Vietnamese Mid-Autumn gift website. The recipient scrolls through a moonlit fairytale and discovers the sender’s affection in a final letter. Mood: gentle, romantic, slightly magical. Target: desktop cinematic presentation; smaller screens retain a readable story path.

## Approved concept and six-scene storyboard

| # | Chapter | Visual | On-screen copy |
|---|---|---|---|
| 1 | Trăng gọi tên em | Full moon among stars, soft clouds, small lanterns | “Tối nay, anh muốn đưa em đến một nơi rất đặc biệt.” |
| 2 | Cánh cửa trên cung trăng | Lunar garden, rabbit and lantern gate | “Nếu em nghe thấy tiếng chuông, hãy đi theo ánh sáng nhé.” |
| 3 | Cuội và Hằng kể chuyện | Cuội beneath the banyan tree; Hằng beside a moonlit lake | “Cuội có cây đa. Chị Hằng có cung trăng. Còn anh có một người anh luôn muốn ở bên.” |
| 4 | Rước đèn cùng nhau | Two silhouettes walking through a lantern street | “Anh muốn cùng em đi qua thật nhiều mùa trăng nữa.” |
| 5 | Những điều anh nhớ | Three lanterns unfold into personal memory frames | `[Ảnh kỷ niệm]` · `[Ngày / địa điểm]` · `[Một câu chuyện ngắn]` |
| 6 | Lời hẹn dưới trăng | Couple memory-heart beneath a large moon; letter reveal | “Chúc em một mùa Trung Thu thật dịu dàng. Cảm ơn em vì đã xuất hiện trong cuộc đời anh.” |

Final letter placeholder:

> `[Tên em],\nAnh không cần một cung trăng thật.\nChỉ cần mỗi mùa trăng sau này, người đi cạnh anh vẫn là em.\nTrung Thu vui vẻ nhé, người anh thương.`

Optional CTA: “Hẹn em một buổi đi chơi”.

## Art direction

- Palette: night `#080B24`, moon gold `#F6D88B`, cloud violet `#8A78B4`, lantern coral `#D9795C`.
- Soft low-poly diorama with warm lunar lighting. Cuội and Hằng are guides; the couple’s story stays central.
- Be Vietnam Pro for Vietnamese body copy; Noto Serif Display for romantic headings, self-host if license/size permit.
- Scroll transition from scene 4 to 5 is the hero moment: lantern light spirals into a moon ring, which opens into memory photos.
- Use HTML text overlays for editable/accessible copy. Audio stays opt-in.

## Technical direction

Vite + TypeScript + Three.js static application, GitHub Pages deployment. Use a local progress-to-scene timeline inspired by scroll-world. Review upstream source/license before copying any code. Prefer locally generated original assets; no paid Monid/Higgsfield services. Public repo starts with clearly marked placeholders; add personal photos only when deliberately supplied.

## Personalization slots

`[TÊN EM]`, `[TÊN ANH]`, `[BIỆT DANH]`, `[ẢNH KỶ NIỆM 01..03]`, `[NGÀY KỶ NIỆM]`, `[ĐỊA ĐIỂM]`, `[CÂU CHỈ HAI NGƯỜI HIỂU]`.

## Visual and interaction guardrails

- Desktop cinematic camera and scroll staging as primary path.
- No blank load: show poster and story text until 3D is ready; preserve story on WebGL failure.
- Reduced-motion and narrow-screen path exposes every chapter without depending on camera animation.
- No autoplay audio, analytics, account, backend, or personal-data collection.
