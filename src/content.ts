export type Chapter = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  hint: string;
};

export const chapters: Chapter[] = [
  {
    id: 'moon', label: 'Trăng gọi tên em', eyebrow: '01 · mở cửa đêm thu',
    title: 'Tối nay, anh muốn đưa em đến một nơi thật đặc biệt.',
    body: 'Ở đó có ánh trăng, có những chiếc đèn lồng, và có một điều nhỏ xíu anh muốn nói với em.', accent: '#f6d88b', hint: 'cuộn để bay vào đêm trăng'
  },
  {
    id: 'gate', label: 'Cánh cửa cung trăng', eyebrow: '02 · theo ánh sáng',
    title: 'Nếu em nghe thấy tiếng chuông, hãy đi theo ánh sáng nhé.',
    body: 'Sau cánh cửa này là một khu vườn chỉ mở vào những đêm rằm.', accent: '#d9795c', hint: 'đi tiếp vào khu vườn'
  },
  {
    id: 'cuoi-hang', label: 'Cuội và Hằng', eyebrow: '03 · người kể chuyện',
    title: 'Cuội có cây đa. Chị Hằng có cung trăng.',
    body: 'Còn anh có một người anh luôn muốn ở bên, qua thật nhiều mùa trăng nữa.', accent: '#b6a3e5', hint: 'gặp hai người bạn trên trăng'
  },
  {
    id: 'lanterns', label: 'Rước đèn cùng nhau', eyebrow: '04 · con đường có hai người',
    title: 'Anh muốn cùng em đi qua thật nhiều mùa trăng nữa.',
    body: 'Chậm một chút cũng được. Miễn là tay mình vẫn tìm thấy tay nhau.', accent: '#f6a76f', hint: 'theo những chiếc đèn lồng'
  },
  {
    id: 'memories', label: 'Những điều anh nhớ', eyebrow: '05 · chỗ dành cho kỷ niệm',
    title: 'Mỗi ánh đèn là một điều anh muốn giữ lại.',
    body: 'Thay những khung ảnh này bằng câu chuyện của hai đứa mình nhé.', accent: '#f6d88b', hint: 'mở những điều anh nhớ'
  },
  {
    id: 'letter', label: 'Lời hẹn dưới trăng', eyebrow: '06 · gửi người anh thương',
    title: 'Chúc em một mùa Trung Thu thật dịu dàng.',
    body: 'Cảm ơn em vì đã xuất hiện. Lá thư này là phần cuối của chuyến bay, nhưng không phải phần cuối của câu chuyện.', accent: '#f5c6d0', hint: 'đọc lá thư cuối cùng'
  }
];

export const memoryPlaceholders = [
  { title: '[Ảnh kỷ niệm 01]', caption: '[ngày · nơi đầu tiên]', detail: '[một câu chỉ hai người hiểu]' },
  { title: '[Ảnh kỷ niệm 02]', caption: '[ngày · buổi hẹn đáng nhớ]', detail: '[điều anh vẫn nhớ]' },
  { title: '[Ảnh kỷ niệm 03]', caption: '[ngày · một chuyến đi]', detail: '[lời hẹn cho lần sau]' }
];
