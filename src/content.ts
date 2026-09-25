export type Chapter = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  hint: string;
};

export type BeatCopy = {
  id: string;
  chapterId: Chapter['id'];
  label: string;
  detail: string;
};

// Copy stays separate from the generated manifest so art can revise a clip
// name or pod without losing the Vietnamese story language.
export const beatCopy: readonly BeatCopy[] = [
  { id: 'moon-arrival', chapterId: 'moon', label: 'Trăng nghiêng qua vai em', detail: 'Đêm vừa mở cửa; ánh trăng rơi chậm như một câu thơ chưa viết hết.' },
  { id: 'gate-glow', chapterId: 'gate', label: 'Cánh cửa cung trăng', detail: 'Nếu nghe tiếng chuông, cứ bước theo ánh sáng. Đêm nay biết đường về.' },
  { id: 'cuoi-seat', chapterId: 'cuoi-hang', label: 'Cuội ngồi bên gốc đa', detail: 'Cuội giữ bóng đa, lá giữ mùi đêm; còn anh giữ một lời hẹn chưa nói.' },
  { id: 'rabbit-pounding', chapterId: 'cuoi-hang', label: 'Thỏ con giã bánh giầy', detail: 'Nhịp chày vang lên vui như tiếng cười, nhỏ thôi mà làm cả vầng trăng thức giấc.' },
  { id: 'hang-dance', chapterId: 'cuoi-hang', label: 'Chị Hằng múa dải lụa', detail: 'Dải lụa đi qua gió, nhẹ như tay áo của một giấc mơ.' },
  { id: 'lantern-entrance', chapterId: 'lanterns', label: 'Rước đèn cùng nhau', detail: 'Đi chậm thôi, để đèn còn kịp soi thấy tay mình tìm lấy tay nhau.' },
  { id: 'fire-hold', chapterId: 'lanterns', label: 'Lửa hồng và đèn lồng', detail: 'Lửa reo khe khẽ; những đốm sáng biết giữ hộ ta điều chưa kịp gọi tên.' },
  { id: 'lan-dance', chapterId: 'lanterns', label: 'Lân sư rộn ràng', detail: 'Tiếng trống gọi niềm vui về, rộn ràng mà vẫn vừa đủ dịu dàng.' },
  { id: 'lantern-exit', chapterId: 'lanterns', label: 'Đèn đưa ta qua cầu', detail: 'Một dòng đèn trôi trước mặt, dẫn ta qua đêm như dẫn qua một câu chuyện.' },
  { id: 'memory-approach', chapterId: 'memories', label: 'Những điều ở lại', detail: 'Có những điều chẳng cần treo lên khung ảnh; chỉ cần nhớ, là đã sáng.' },
  { id: 'memory-hold', chapterId: 'memories', label: 'Đêm dài, lời ngắn', detail: 'Giữa bao nhiêu vì sao, anh chỉ muốn giữ một khoảng trời vừa đủ cho em.' },
  { id: 'letter-rise', chapterId: 'letter', label: 'Phong thư bước ra từ ánh trăng', detail: 'Lá thư tự tìm đến bên em, như một lời hẹn biết đường quay lại.' },
  { id: 'letter-open', chapterId: 'letter', label: 'Lời hẹn dưới trăng', detail: 'Phong thư mở ra. Xin đọc thật chậm; có những lời đẹp hơn khi không vội.' },
  { id: 'letter-rest', chapterId: 'letter', label: 'Lời hẹn dưới trăng', detail: 'Trăng rồi sẽ khuyết, đèn rồi sẽ tàn; lời hẹn này thì xin được ở lại.' },
];

export const chapters: Chapter[] = [
  {
    id: 'moon', label: 'Trăng gọi tên em', eyebrow: '01 · mở cửa đêm thu',
    title: 'Đêm nay, trăng nghiêng qua vai em.',
    body: 'Anh đưa em qua một cánh cửa nhỏ, nơi ánh sáng rơi chậm và mọi lời chưa nói đều có chỗ để ở lại.', accent: '#f6d88b', hint: 'cuộn để bay vào đêm trăng'
  },
  {
    id: 'gate', label: 'Cánh cửa cung trăng', eyebrow: '02 · theo ánh sáng',
    title: 'Nếu nghe tiếng chuông, cứ bước theo ánh sáng.',
    body: 'Sau cánh cửa là khu vườn chỉ mở vào đêm rằm — nơi đêm biết hát và trăng biết chờ.', accent: '#d9795c', hint: 'đi tiếp vào khu vườn'
  },
  {
    id: 'cuoi-hang', label: 'Cuội và Hằng', eyebrow: '03 · người kể chuyện',
    title: 'Cuội giữ bóng đa. Hằng giữ vầng trăng.',
    body: 'Còn anh giữ một lời hẹn giản dị: qua bao mùa trăng, vẫn muốn đi bên em.', accent: '#b6a3e5', hint: 'gặp hai người bạn trên trăng'
  },
  {
    id: 'lanterns', label: 'Rước đèn cùng nhau', eyebrow: '04 · con đường có hai người',
    title: 'Đi chậm thôi, để đèn còn kịp soi tay mình.',
    body: 'Ta đâu cần một đêm thật dài; chỉ cần đủ lâu để niềm vui đi cạnh nhau mà không lạc mất.', accent: '#f6a76f', hint: 'theo những chiếc đèn lồng'
  },
  {
    id: 'memories', label: 'Những điều anh nhớ', eyebrow: '05 · chỗ dành cho kỷ niệm',
    title: 'Có những điều chẳng cần treo lên khung ảnh.',
    body: 'Một tiếng cười, một đốm lửa, một bàn tay tìm thấy bàn tay — nhớ được thế là đủ.', accent: '#f6d88b', hint: 'đi qua những điều ở lại'
  },
  {
    id: 'letter', label: 'Lời hẹn dưới trăng', eyebrow: '06 · gửi người anh thương',
    title: 'Đêm đẹp nhất là đêm có người để nhớ.',
    body: 'Trăng rồi sẽ khuyết, đèn rồi sẽ tàn; có vài điều vì thế mà càng sáng.', accent: '#f5c6d0', hint: 'đọc lá thư cuối cùng'
  }
];

export const letter = {
  recipient: 'em',
  sender: 'anh',
  paragraphs: [
    'Anh không cần một cung trăng thật.',
    'Chỉ cần sau mỗi mùa trăng, người đi bên anh vẫn là em.',
    'Giữa bao nhiêu đêm rộng, gặp được em đã là một điều đẹp.',
    'Nếu đời là một vở kịch dài, anh mong được cùng em đi qua những hồi dịu dàng nhất.',
  ],
} satisfies { recipient: string; sender: string; paragraphs: string[] };
