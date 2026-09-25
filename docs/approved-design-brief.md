# Approved Design Brief — “Đêm trăng chỉ có hai đứa mình”

## Product intent

A personal Vietnamese Mid-Autumn gift website. The recipient scrolls through a moonlit fairytale and discovers the sender’s affection in a final letter. Mood: gentle, romantic, slightly magical. Target: desktop cinematic presentation; smaller screens retain a readable story path.

## Approved concept and six-scene storyboard

This table records the intended experience, not completed animation or visual approval. The executable owners are routed from the [art contract](true-3d-art-contract.md).

| # | Chapter | Visual | On-screen copy |
|---|---|---|---|
| 1 | Trăng gọi tên em | Full moon among stars, soft clouds, small lanterns | “Đêm nay, trăng nghiêng qua vai em.” |
| 2 | Cánh cửa trên cung trăng | Lunar garden, rabbit and lantern gate | “Nếu nghe tiếng chuông, cứ bước theo ánh sáng.” |
| 3 | Cuội và Hằng kể chuyện | Cuội beneath the banyan tree; Hằng beside a moonlit lake | “Cuội giữ bóng đa. Hằng giữ vầng trăng.” |
| 4 | Rước đèn cùng nhau | Two silhouettes walking through a lantern street | “Đi chậm thôi, để đèn còn kịp soi tay mình.” |
| 5 | Những điều anh nhớ | Lanterns, fire and a quiet pause beneath the moon | “Có những điều chẳng cần treo lên khung ảnh.” |
| 6 | Lời hẹn dưới trăng | Letter rising from the moonlit stage and opening by itself | “Đêm đẹp nhất là đêm có người để nhớ.” |

Final letter:

> `Gửi em\nAnh không cần một cung trăng thật.\nChỉ cần sau mỗi mùa trăng, người đi bên anh vẫn là em.\nGiữa bao nhiêu đêm rộng, gặp được em đã là một điều đẹp.`

Optional CTA: “Hẹn em một buổi đi chơi”.

## Art direction

- Palette: night `#080B24`, moon gold `#F6D88B`, cloud violet `#8A78B4`, lantern coral `#D9795C`.
- Cinematic semi-realistic storybook 3D with warm lunar lighting, as defined in the [art contract](true-3d-art-contract.md). Cuội and Hằng are guides; the couple’s story stays central.
- Be Vietnam Pro for Vietnamese body copy; Noto Serif Display for romantic headings, self-host if license/size permit.
- Scroll transition from scene 4 to 5 is the hero moment: lantern light spirals into a moon ring, then settles into a quiet spoken passage.
- Use HTML text overlays for editable/accessible copy. Audio stays opt-in.

## Technical direction

Vite + TypeScript + Three.js static application, GitHub Pages deployment. Use a local progress-to-scene timeline inspired by scroll-world. Review upstream source/license before copying any code. Prefer locally generated original assets; no paid Monid/Higgsfield services. The default gift keeps its memory chapter purely typographic and carries no photo placeholders.

## Personalization slots

No name slots are required in the default gift copy; the letter opens with “Gửi em”.

## Visual and interaction guardrails

- Desktop cinematic camera and scroll staging as primary path.
- No blank load: show poster and story text until 3D is ready; preserve story on WebGL failure.
- Reduced-motion and narrow-screen path exposes every chapter without depending on camera animation.
- No autoplay audio, analytics, account, backend, or personal-data collection.
