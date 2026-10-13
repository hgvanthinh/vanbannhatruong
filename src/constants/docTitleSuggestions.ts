import type { DocCategory } from './docCategories';

/**
 * Tên các văn bản thường có của 1 trường học — gợi ý khi gõ "Tên tài liệu"
 * ở modal Đăng văn bản. Chỉ là gợi ý: người đăng vẫn gõ tên bất kỳ.
 * `{NH}` được thay bằng năm học hiện tại (VD 2026-2027).
 * `category` chỉ ghi khi KHÁC "Văn bản Nhà trường"; Hình thức tự suy ra từ chữ đầu tên.
 */
const SUGGESTIONS: { title: string; category?: DocCategory }[] = [
  // Kế hoạch
  { title: 'Kế hoạch năm học {NH}' },
  { title: 'Kế hoạch giáo dục nhà trường năm học {NH}' },
  { title: 'Kế hoạch dạy học các môn học năm học {NH}' },
  { title: 'Kế hoạch tổ chức các hoạt động giáo dục năm học {NH}' },
  { title: 'Kế hoạch kiểm tra nội bộ năm học {NH}' },
  { title: 'Kế hoạch bồi dưỡng thường xuyên năm học {NH}' },
  { title: 'Kế hoạch bồi dưỡng học sinh giỏi năm học {NH}' },
  { title: 'Kế hoạch phụ đạo học sinh chưa đạt năm học {NH}' },
  { title: 'Kế hoạch sinh hoạt chuyên môn theo nghiên cứu bài học năm học {NH}' },
  { title: 'Kế hoạch kiểm tra, đánh giá định kỳ năm học {NH}' },
  { title: 'Kế hoạch tổ chức kiểm tra giữa học kỳ I năm học {NH}' },
  { title: 'Kế hoạch tổ chức kiểm tra cuối học kỳ I năm học {NH}' },
  { title: 'Kế hoạch tổ chức kiểm tra giữa học kỳ II năm học {NH}' },
  { title: 'Kế hoạch tổ chức kiểm tra cuối học kỳ II năm học {NH}' },
  { title: 'Kế hoạch thực hiện chuyển đổi số năm học {NH}' },
  { title: 'Kế hoạch tự đánh giá chất lượng giáo dục' },
  { title: 'Kế hoạch chiến lược phát triển nhà trường giai đoạn' },
  { title: 'Kế hoạch tổ chức phong trào thi đua năm học {NH}' },
  { title: 'Kế hoạch tổ chức Hội nghị viên chức, người lao động năm học {NH}' },
  { title: 'Kế hoạch thực hiện công khai năm học {NH}' },
  { title: 'Kế hoạch tuyển sinh năm học {NH}' },
  { title: 'Kế hoạch tổ chức Lễ khai giảng năm học {NH}' },
  { title: 'Kế hoạch công tác y tế trường học năm học {NH}' },
  { title: 'Kế hoạch phòng cháy, chữa cháy và cứu nạn, cứu hộ' },
  { title: 'Kế hoạch phòng, chống thiên tai và tìm kiếm cứu nạn' },
  { title: 'Kế hoạch giáo dục kỹ năng sống năm học {NH}' },
  { title: 'Kế hoạch đảm bảo an ninh trật tự, an toàn trường học năm học {NH}' },
  { title: 'Kế hoạch hoạt động thư viện năm học {NH}' },
  { title: 'Kế hoạch tháng' },
  { title: 'Kế hoạch tuần' },
  { title: 'Kế hoạch hoạt động Công đoàn năm học {NH}', category: 'cong-doan' },
  { title: 'Kế hoạch hoạt động Đội năm học {NH}', category: 'doan-doi' },
  { title: 'Kế hoạch hoạt động Đoàn thanh niên năm học {NH}', category: 'doan-doi' },

  // Quy chế
  { title: 'Quy chế chi tiêu nội bộ' },
  { title: 'Quy chế thực hiện dân chủ ở cơ sở' },
  { title: 'Quy chế làm việc' },
  { title: 'Quy chế quản lý, sử dụng tài sản công' },
  { title: 'Quy chế thi đua, khen thưởng' },
  { title: 'Quy chế đánh giá, xếp loại chất lượng viên chức' },
  { title: 'Quy chế phối hợp giữa Nhà trường và Công đoàn', category: 'cong-doan' },
  { title: 'Quy chế hoạt động của Hội đồng trường' },

  // Nội quy
  { title: 'Nội quy nhà trường' },
  { title: 'Nội quy cơ quan' },
  { title: 'Nội quy học sinh' },
  { title: 'Nội quy phòng học bộ môn' },
  { title: 'Nội quy phòng máy tính' },
  { title: 'Nội quy phòng thí nghiệm' },
  { title: 'Nội quy thư viện' },
  { title: 'Nội quy bán trú', category: 'ban-tru' },
  { title: 'Nội quy phòng cháy, chữa cháy' },
  { title: 'Nội quy tiếp công dân' },

  // Quyết định
  { title: 'Quyết định phân công nhiệm vụ năm học {NH}' },
  { title: 'Quyết định thành lập các tổ chuyên môn, tổ văn phòng năm học {NH}' },
  { title: 'Quyết định bổ nhiệm tổ trưởng, tổ phó chuyên môn năm học {NH}' },
  { title: 'Quyết định thành lập Ban kiểm tra nội bộ năm học {NH}' },
  { title: 'Quyết định thành lập Hội đồng thi đua, khen thưởng năm học {NH}' },
  { title: 'Quyết định thành lập Hội đồng tự đánh giá' },
  { title: 'Quyết định ban hành Quy chế chi tiêu nội bộ' },
  { title: 'Quyết định ban hành Kế hoạch giáo dục nhà trường năm học {NH}' },
  { title: 'Quyết định công nhận Ban Thanh tra nhân dân' },

  // Báo cáo
  { title: 'Báo cáo sơ kết học kỳ I năm học {NH}' },
  { title: 'Báo cáo tổng kết năm học {NH}' },
  { title: 'Báo cáo tự đánh giá chất lượng giáo dục' },
  { title: 'Báo cáo thực hiện công khai năm học {NH}' },
  { title: 'Báo cáo thống kê đầu năm học {NH}' },
  { title: 'Báo cáo kết quả kiểm tra nội bộ năm học {NH}' },
  { title: 'Báo cáo công khai tài chính' },

  // Biên bản
  { title: 'Biên bản họp Hội đồng sư phạm' },
  { title: 'Biên bản Hội nghị viên chức, người lao động năm học {NH}' },
  { title: 'Biên bản họp tổ chuyên môn' },
  { title: 'Biên bản họp Hội đồng thi đua, khen thưởng' },
  { title: 'Biên bản họp cha mẹ học sinh' },
  { title: 'Biên bản kiểm kê tài sản' },

  // Thông báo
  { title: 'Thông báo lịch công tác tuần' },
  { title: 'Thông báo tuyển sinh năm học {NH}' },
  { title: 'Thông báo kết luận cuộc họp' },
  { title: 'Thông báo lịch nghỉ Tết' },

  // Chương trình
  { title: 'Chương trình Hội nghị viên chức, người lao động năm học {NH}' },
  { title: 'Chương trình Lễ khai giảng năm học {NH}' },
  { title: 'Chương trình Lễ tổng kết năm học {NH}' },
  { title: 'Chương trình hành động' },

  // Nghị quyết
  { title: 'Nghị quyết Hội nghị viên chức, người lao động năm học {NH}' },
  { title: 'Nghị quyết Hội đồng trường' },
  { title: 'Nghị quyết Chi bộ tháng', category: 'chi-bo' },

  // Tờ trình
  { title: 'Tờ trình đề nghị khen thưởng' },
  { title: 'Tờ trình đề nghị phê duyệt Kế hoạch giáo dục nhà trường năm học {NH}' },

  // Hướng dẫn
  { title: 'Hướng dẫn thực hiện hồ sơ, sổ sách chuyên môn năm học {NH}' },
  { title: 'Hướng dẫn đánh giá, xếp loại học sinh' },

  // Khác
  { title: 'Bảng phân công chuyên môn năm học {NH}' },
  { title: 'Thời khóa biểu' },
  { title: 'Lịch công tác tháng' },
  { title: 'Bộ quy tắc ứng xử trong nhà trường' },
];

/** Năm học hiện tại: từ tháng 8 tính là năm học mới (13/10/2026 → "2026-2027"). */
export function currentSchoolYear(now = new Date()): string {
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

export function getDocTitleSuggestions(): { title: string; category?: DocCategory }[] {
  const year = currentSchoolYear();
  return SUGGESTIONS.map((s) => ({ ...s, title: s.title.replace('{NH}', year) }));
}
