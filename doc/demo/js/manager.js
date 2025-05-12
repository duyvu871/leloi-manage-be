// Manager Dashboard JavaScript file

// Mock data for demonstration
const mockStudents = [
    {
        id: "HS2025001",
        student: {
            name: "Nguyễn Văn Em",
            dob: "2010-05-15",
            gender: "male",
            address: "123 Đường Lê Lợi, Quận 1, TP HCM"
        },
        parent: {
            name: "Nguyễn Văn Cha",
            phone: "0912345678",
            email: "nguyen.cha@example.com",
            relationship: "father"
        },
        school: {
            name: "THCS Lê Lợi",
            address: "456 Đường Nguyễn Huệ, Quận 1, TP HCM"
        },
        transcriptData: {
            subjects: [
                { name: "Toán", score: 9.0, evaluation: "Học sinh có khả năng tư duy logic tốt" },
                { name: "Văn", score: 8.5, evaluation: "Học sinh có năng khiếu viết văn và kỹ năng diễn đạt tốt" },
                { name: "Anh", score: 9.5, evaluation: "Học sinh có khả năng giao tiếp tiếng Anh tốt" },
                { name: "Lịch sử", score: 8.0, evaluation: "Học sinh có kiến thức lịch sử khá" },
                { name: "Địa lý", score: 8.5, evaluation: "Học sinh hiểu biết tốt về các vấn đề địa lý" }
            ],
            behavior: "Tốt",
            attendanceRate: "95%",
            teacherComments: "Học sinh chăm chỉ, hoà đồng với bạn bè và tích cực tham gia các hoạt động của trường."
        },
        status: {
            currentStatus: "eligible", // eligible, ineligible, pending, confirmed
            reason: "",
            lastUpdated: "2025-04-15",
            examInfo: {
                sbd: "TS2025001",
                room: "P201",
                date: "2025-05-20",
                time: "08:00 - 11:30"
            }
        },
        certificates: ["Chứng chỉ Tiếng Anh A2", "Giấy khen HSG cấp quận"]
    },
    {
        id: "HS2025002",
        student: {
            name: "Trần Thị Nữ",
            dob: "2010-08-20",
            gender: "female",
            address: "789 Đường Nguyễn Du, Quận 3, TP HCM"
        },
        parent: {
            name: "Trần Văn Cha",
            phone: "0923456789",
            email: "tran.cha@example.com",
            relationship: "father"
        },
        school: {
            name: "THCS Quang Trung",
            address: "321 Đường Hai Bà Trưng, Quận 3, TP HCM"
        },
        transcriptData: {
            subjects: [
                { name: "Toán", score: 8.0, evaluation: "Học sinh có khả năng làm toán tốt" },
                { name: "Văn", score: 9.0, evaluation: "Học sinh có năng khiếu văn học và sáng tác" },
                { name: "Anh", score: 8.5, evaluation: "Học sinh có khả năng giao tiếp tiếng Anh khá" },
                { name: "Lịch sử", score: 8.5, evaluation: "Học sinh nắm vững kiến thức lịch sử" },
                { name: "Địa lý", score: 8.0, evaluation: "Học sinh hiểu biết tốt về các vấn đề địa lý" }
            ],
            behavior: "Tốt",
            attendanceRate: "98%",
            teacherComments: "Học sinh ngoan ngoãn, có tinh thần học tập tốt và luôn giúp đỡ bạn bè."
        },
        status: {
            currentStatus: "ineligible",
            reason: "Điểm trung bình môn Toán không đạt yêu cầu tối thiểu",
            lastUpdated: "2025-04-14",
            examInfo: null
        },
        certificates: []
    },
    {
        id: "HS2025003",
        student: {
            name: "Lê Văn Nam",
            dob: "2010-11-10",
            gender: "male",
            address: "456 Đường Cách Mạng Tháng 8, Quận 10, TP HCM"
        },
        parent: {
            name: "Lê Thị Mẹ",
            phone: "0934567890",
            email: "le.me@example.com",
            relationship: "mother"
        },
        school: {
            name: "THCS Nguyễn Thái Học",
            address: "123 Đường 3/2, Quận 10, TP HCM"
        },
        transcriptData: {
            subjects: [
                { name: "Toán", score: 8.5, evaluation: "Học sinh có khả năng tư duy logic tốt" },
                { name: "Văn", score: 7.5, evaluation: "Học sinh cần cải thiện kỹ năng viết" },
                { name: "Anh", score: 8.0, evaluation: "Học sinh có khả năng tiếng Anh khá" },
                { name: "Lịch sử", score: 7.0, evaluation: "Học sinh cần củng cố kiến thức lịch sử" },
                { name: "Địa lý", score: 8.0, evaluation: "Học sinh hiểu biết tốt về các vấn đề địa lý" }
            ],
            behavior: "Khá",
            attendanceRate: "90%",
            teacherComments: "Học sinh có tinh thần học tập tốt, cần cải thiện tính kỷ luật trong lớp."
        },
        status: {
            currentStatus: "pending",
            reason: "Hồ sơ đang được xem xét do scan học bạ không chính xác",
            lastUpdated: "2025-04-16",
            examInfo: null
        },
        certificates: ["Giấy khen Học sinh tiến bộ"]
    },
    {
        id: "HS2025004",
        student: {
            name: "Phạm Thị Nữ",
            dob: "2010-04-05",
            gender: "female",
            address: "789 Đường Nguyễn Trãi, Quận 5, TP HCM"
        },
        parent: {
            name: "Phạm Văn Cha",
            phone: "0945678901",
            email: "pham.cha@example.com",
            relationship: "father"
        },
        school: {
            name: "THCS Lê Quý Đôn",
            address: "456 Đường Lý Thường Kiệt, Quận 5, TP HCM"
        },
        transcriptData: {
            subjects: [
                { name: "Toán", score: 9.5, evaluation: "Học sinh xuất sắc về toán học" },
                { name: "Văn", score: 8.0, evaluation: "Học sinh có khả năng diễn đạt tốt" },
                { name: "Anh", score: 9.0, evaluation: "Học sinh có năng khiếu ngôn ngữ" },
                { name: "Lịch sử", score: 8.5, evaluation: "Học sinh nắm vững kiến thức lịch sử" },
                { name: "Địa lý", score: 9.0, evaluation: "Học sinh có kiến thức địa lý tốt" }
            ],
            behavior: "Tốt",
            attendanceRate: "97%",
            teacherComments: "Học sinh xuất sắc, có tinh thần học tập nghiêm túc và tính kỷ luật cao."
        },
        status: {
            currentStatus: "confirmed",
            reason: "",
            lastUpdated: "2025-04-18",
            examInfo: {
                sbd: "TS2025004",
                room: "P202",
                date: "2025-05-20",
                time: "08:00 - 11:30"
            }
        },
        certificates: ["Chứng chỉ Toán Quốc tế", "Giấy khen HSG cấp thành phố"]
    },
    {
        id: "HS2025005",
        student: {
            name: "Hoàng Văn Nam",
            dob: "2010-09-22",
            gender: "male",
            address: "123 Đường Trần Hưng Đạo, Quận 1, TP HCM"
        },
        parent: {
            name: "Hoàng Thị Mẹ",
            phone: "0956789012",
            email: "hoang.me@example.com",
            relationship: "mother"
        },
        school: {
            name: "THCS Trần Phú",
            address: "789 Đường Lê Lai, Quận 1, TP HCM"
        },
        transcriptData: {
            subjects: [
                { name: "Toán", score: 7.5, evaluation: "Học sinh có khả năng tư duy logic" },
                { name: "Văn", score: 8.0, evaluation: "Học sinh có khả năng viết tốt" },
                { name: "Anh", score: 7.0, evaluation: "Học sinh cần cải thiện kỹ năng tiếng Anh" },
                { name: "Lịch sử", score: 8.5, evaluation: "Học sinh hiểu biết tốt về lịch sử" },
                { name: "Địa lý", score: 8.0, evaluation: "Học sinh có kiến thức địa lý tốt" }
            ],
            behavior: "Khá",
            attendanceRate: "92%",
            teacherComments: "Học sinh có tinh thần học tập tốt, cần cải thiện kỹ năng làm việc nhóm."
        },
        status: {
            currentStatus: "eligible",
            reason: "",
            lastUpdated: "2025-04-17",
            examInfo: {
                sbd: "TS2025005",
                room: "P203",
                date: "2025-05-20",
                time: "08:00 - 11:30"
            }
        },
        certificates: ["Giấy khen Học sinh tiến bộ"]
    }
];

// Mock schedules for admission submissions
const mockSchedules = [
    {
        id: "SCH001",
        date: "2025-05-01",
        timeSlots: [
            { time: "08:00 - 09:00", maxStudents: 10, currentStudents: 7 },
            { time: "09:00 - 10:00", maxStudents: 10, currentStudents: 10 },
            { time: "10:00 - 11:00", maxStudents: 10, currentStudents: 5 },
            { time: "13:00 - 14:00", maxStudents: 10, currentStudents: 8 },
            { time: "14:00 - 15:00", maxStudents: 10, currentStudents: 3 }
        ]
    },
    {
        id: "SCH002",
        date: "2025-05-02",
        timeSlots: [
            { time: "08:00 - 09:00", maxStudents: 10, currentStudents: 4 },
            { time: "09:00 - 10:00", maxStudents: 10, currentStudents: 6 },
            { time: "10:00 - 11:00", maxStudents: 10, currentStudents: 2 },
            { time: "13:00 - 14:00", maxStudents: 10, currentStudents: 0 },
            { time: "14:00 - 15:00", maxStudents: 10, currentStudents: 1 }
        ]
    }
];

// Current page for pagination
let currentPage = 1;
const itemsPerPage = 10;

$(document).ready(function() {
    // Tab navigation
    $('.tab-link').on('click', function(e) {
        e.preventDefault();
        
        const targetTab = $(this).data('tab');
        
        // Update active tab link
        $('.tab-link').removeClass('active').addClass('text-gray-700').removeClass('text-primary');
        $(this).addClass('active').removeClass('text-gray-700').addClass('text-primary');
        
        // Show target tab content
        $('.tab-content').removeClass('active').addClass('hidden');
        $(`#${targetTab}`).addClass('active').removeClass('hidden');
        
        // Load specific tab data if needed
        if (targetTab === 'student-list') {
            loadStudentList();
        } else if (targetTab === 'schedule-manager') {
            loadSchedules();
        } else if (targetTab === 'pending-review') {
            loadPendingStudents();
        }
    });
    
    // Initialize student list
    loadStudentList();
    updateStats();
    
    // Search functionality
    $('#search-students').on('keyup', function() {
        loadStudentList();
    });
    
    // Advanced filter toggle
    $('#advanced-filter-btn').on('click', function() {
        $('#advanced-filters').toggleClass('hidden');
    });
    
    // Apply filters
    $('#apply-filters').on('click', function() {
        loadStudentList();
    });
    
    // Pagination
    $('#prev-page').on('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadStudentList();
        }
    });
    
    $('#next-page').on('click', function() {
        const totalPages = Math.ceil(getFilteredStudents().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            loadStudentList();
        }
    });
    
    // Schedule manager events
    $('#add-schedule-btn').on('click', function() {
        $('#add-schedule-form').removeClass('hidden');
    });
    
    $('#cancel-schedule').on('click', function() {
        $('#add-schedule-form').addClass('hidden');
    });
    
    $('#save-schedule').on('click', function() {
        saveNewSchedule();
    });
    
    // Student detail modal
    $('#close-detail-modal').on('click', function() {
        $('#student-detail-modal').addClass('hidden');
    });
    
    // Delegate for dynamically created view buttons
    $(document).on('click', '.view-student-btn', function() {
        const studentId = $(this).data('id');
        openStudentDetail(studentId);
    });
    
    // Review pending applications
    $(document).on('click', '.review-student-btn', function() {
        const studentId = $(this).data('id');
        openStudentDetail(studentId, true);
    });
    
    // Mark eligible/ineligible buttons
    $('#mark-eligible').on('click', function() {
        const studentId = $('#detail-student-id').text().replace('ID: ', '');
        updateStudentStatus(studentId, 'eligible', '');
        alert('Hồ sơ đã được cập nhật thành Đủ điều kiện!');
        $('#student-detail-modal').addClass('hidden');
        loadPendingStudents();
        updateStats();
    });
    
    $('#mark-ineligible').on('click', function() {
        const reason = $('#review-notes').val();
        if (!reason) {
            alert('Vui lòng nhập lý do không đủ điều kiện');
            return;
        }
        
        const studentId = $('#detail-student-id').text().replace('ID: ', '');
        updateStudentStatus(studentId, 'ineligible', reason);
        alert('Hồ sơ đã được cập nhật thành Không đủ điều kiện!');
        $('#student-detail-modal').addClass('hidden');
        loadPendingStudents();
        updateStats();
    });
    
    // Confirmation tab
    $('#verify-student').on('click', function() {
        const studentId = $('#student-id-search').val();
        if (!studentId) {
            alert('Vui lòng nhập mã ID học sinh');
            return;
        }
        
        verifyStudent(studentId);
    });
    
    // Verification checkbox
    $('#verification-confirm').on('change', function() {
        $('#approve-application').prop('disabled', !$(this).is(':checked'));
    });
    
    // Approval/rejection buttons
    $('#approve-application').on('click', function() {
        const studentId = $('#verification-student-id').text().replace('ID: ', '');
        const notes = $('#verification-notes').val();
        
        updateStudentStatus(studentId, 'confirmed', notes);
        alert('Hồ sơ đã được xác nhận thành công!');
        
        // Reset form
        $('#student-id-search').val('');
        $('#student-verification-result').addClass('hidden');
        $('#verification-confirm').prop('checked', false);
        $('#approve-application').prop('disabled', true);
        
        updateStats();
    });
    
    $('#reject-application').on('click', function() {
        const studentId = $('#verification-student-id').text().replace('ID: ', '');
        const notes = $('#verification-notes').val() || 'Hồ sơ trực tiếp không khớp với thông tin đã đăng ký';
        
        updateStudentStatus(studentId, 'ineligible', notes);
        alert('Hồ sơ đã bị từ chối!');
        
        // Reset form
        $('#student-id-search').val('');
        $('#student-verification-result').addClass('hidden');
        $('#verification-confirm').prop('checked', false);
        $('#approve-application').prop('disabled', true);
        
        updateStats();
    });
    
    // Search pending students
    $('#search-pending').on('keyup', function() {
        loadPendingStudents();
    });
});

// Get filtered students based on search and filters
function getFilteredStudents() {
    const searchTerm = $('#search-students').val().toLowerCase();
    const statusFilter = $('#filter-status').val();
    const genderFilter = $('#filter-gender').val();
    const schoolFilter = $('#filter-school').val().toLowerCase();
    
    return mockStudents.filter(student => {
        // Search term filter
        const matchesSearch = !searchTerm || 
            student.student.name.toLowerCase().includes(searchTerm) || 
            student.id.toLowerCase().includes(searchTerm);
        
        // Status filter
        const matchesStatus = !statusFilter || student.status.currentStatus === statusFilter;
        
        // Gender filter
        const matchesGender = !genderFilter || student.student.gender === genderFilter;
        
        // School filter
        const matchesSchool = !schoolFilter || student.school.name.toLowerCase().includes(schoolFilter);
        
        return matchesSearch && matchesStatus && matchesGender && matchesSchool;
    });
}

// Load the student list
function loadStudentList() {
    const filteredStudents = getFilteredStudents();
    
    // Calculate pagination
    const totalStudents = filteredStudents.length;
    const totalPages = Math.ceil(totalStudents / itemsPerPage);
    
    // Adjust current page if needed
    if (currentPage > totalPages) {
        currentPage = totalPages || 1;
    }
    
    // Calculate slice for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const studentsToShow = filteredStudents.slice(startIndex, endIndex);
    
    // Update pagination info
    $('#showing-records').text(studentsToShow.length);
    $('#total-records').text(totalStudents);
    
    // Enable/disable pagination buttons
    $('#prev-page').prop('disabled', currentPage === 1);
    $('#next-page').prop('disabled', currentPage === totalPages || totalPages === 0);
    
    // Clear table and add students
    $('#student-list-body').empty();
    
    if (studentsToShow.length === 0) {
        $('#student-list-body').append(`
            <tr>
                <td colspan="6" class="px-4 py-6 text-center text-gray-500">Không tìm thấy học sinh nào.</td>
            </tr>
        `);
        return;
    }
    
    studentsToShow.forEach(student => {
        // Format date
        const dob = new Date(student.student.dob).toLocaleDateString('vi-VN');
        
        // Format status badge
        let statusBadge, statusText;
        
        switch (student.status.currentStatus) {
            case 'eligible':
                statusBadge = 'bg-green-600';
                statusText = 'Đủ điều kiện';
                break;
            case 'ineligible':
                statusBadge = 'bg-red-600';
                statusText = 'Không đủ điều kiện';
                break;
            case 'pending':
                statusBadge = 'bg-yellow-500';
                statusText = 'Đang xử lý';
                break;
            case 'confirmed':
                statusBadge = 'bg-blue-600';
                statusText = 'Đã xác nhận';
                break;
            default:
                statusBadge = 'bg-gray-500';
                statusText = 'Không xác định';
        }
        
        const row = `
            <tr>
                <td class="px-4 py-3 whitespace-nowrap">${student.id}</td>
                <td class="px-4 py-3">${student.student.name}</td>
                <td class="px-4 py-3">${dob}</td>
                <td class="px-4 py-3">${student.school.name}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-white text-xs ${statusBadge}">${statusText}</span>
                </td>
                <td class="px-4 py-3">
                    <button class="view-student-btn text-primary hover:text-blue-800" data-id="${student.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                </td>
            </tr>
        `;
        
        $('#student-list-body').append(row);
    });
}

// Load the pending students
function loadPendingStudents() {
    const searchTerm = $('#search-pending').val().toLowerCase();
    
    // Filter to only pending status students
    const pendingStudents = mockStudents.filter(student => {
        return student.status.currentStatus === 'pending' && 
            (!searchTerm || student.student.name.toLowerCase().includes(searchTerm) || student.id.toLowerCase().includes(searchTerm));
    });
    
    // Clear and populate table
    $('#pending-list-body').empty();
    
    if (pendingStudents.length === 0) {
        $('#pending-list-body').append(`
            <tr>
                <td colspan="5" class="px-4 py-6 text-center text-gray-500">Không có hồ sơ nào đang chờ xử lý.</td>
            </tr>
        `);
        return;
    }
    
    pendingStudents.forEach(student => {
        // Format date
        const lastUpdated = new Date(student.status.lastUpdated).toLocaleDateString('vi-VN');
        
        const row = `
            <tr>
                <td class="px-4 py-3 whitespace-nowrap">${student.id}</td>
                <td class="px-4 py-3">${student.student.name}</td>
                <td class="px-4 py-3">${student.status.reason}</td>
                <td class="px-4 py-3">${lastUpdated}</td>
                <td class="px-4 py-3">
                    <button class="review-student-btn text-primary hover:text-blue-800" data-id="${student.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </td>
            </tr>
        `;
        
        $('#pending-list-body').append(row);
    });
}

// Open student detail modal
function openStudentDetail(studentId, isPending = false) {
    const student = mockStudents.find(s => s.id === studentId);
    
    if (!student) {
        alert('Không tìm thấy thông tin học sinh!');
        return;
    }
    
    // Populate student details
    $('#detail-student-name').text(student.student.name);
    $('#detail-student-id').text(`ID: ${student.id}`);
    
    // Format date
    const dob = new Date(student.student.dob).toLocaleDateString('vi-VN');
    $('#detail-student-dob').text(dob);
    
    // Gender
    $('#detail-student-gender').text(student.student.gender === 'male' ? 'Nam' : 'Nữ');
    $('#detail-student-address').text(student.student.address);
    
    // Parent info
    $('#detail-parent-name').text(student.parent.name);
    $('#detail-parent-relationship').text(getRelationshipText(student.parent.relationship));
    $('#detail-parent-phone').text(student.parent.phone);
    $('#detail-parent-email').text(student.parent.email);
    
    // School info
    $('#detail-current-school').text(student.school.name);
    $('#detail-school-address').text(student.school.address);
    
    // Status badge
    $('#detail-status-badge').removeClass('bg-green-600 bg-red-600 bg-yellow-500 bg-blue-600');
    
    switch (student.status.currentStatus) {
        case 'eligible':
            $('#detail-status-badge').addClass('bg-green-600').text('Đủ điều kiện');
            break;
        case 'ineligible':
            $('#detail-status-badge').addClass('bg-red-600').text('Không đủ điều kiện');
            break;
        case 'pending':
            $('#detail-status-badge').addClass('bg-yellow-500').text('Đang xử lý');
            break;
        case 'confirmed':
            $('#detail-status-badge').addClass('bg-blue-600').text('Đã xác nhận');
            break;
        default:
            $('#detail-status-badge').addClass('bg-gray-500').text('Không xác định');
    }
    
    // Transcript results
    displayTranscriptResults(student.transcriptData, 'detail-transcript-results');
    
    // Show certificates
    $('#detail-certificates').empty();
    
    if (student.certificates && student.certificates.length > 0) {
        student.certificates.forEach(cert => {
            $('#detail-certificates').append(`
                <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>${cert}</span>
                    </div>
                    <a href="#" class="text-primary hover:underline">Xem</a>
                </div>
            `);
        });
    } else {
        $('#detail-certificates').append(`
            <p class="text-gray-500 mt-2">Không có chứng chỉ nào được tải lên.</p>
        `);
    }
    
    // Handle pending review section
    if (isPending) {
        $('#detail-pending-review').removeClass('hidden');
        $('#detail-pending-reason').text(student.status.reason);
    } else {
        $('#detail-pending-review').addClass('hidden');
    }
    
    // Show modal
    $('#student-detail-modal').removeClass('hidden');
}

// Verify student for confirmation
function verifyStudent(studentId) {
    const student = mockStudents.find(s => s.id === studentId);
    
    if (!student) {
        alert('Không tìm thấy thông tin học sinh!');
        return;
    }
    
    // Check if student is eligible
    if (student.status.currentStatus !== 'eligible') {
        alert('Học sinh này không đủ điều kiện hoặc đã được xác nhận!');
        return;
    }
    
    // Populate verification form
    $('#verification-student-name').text(student.student.name);
    
    // Format date
    const dob = new Date(student.student.dob).toLocaleDateString('vi-VN');
    $('#verification-student-dob').text(dob);
    
    $('#verification-student-id').text(`ID: ${student.id}`);
    
    // Parent info
    $('#verification-parent-name').text(student.parent.name);
    $('#verification-parent-phone').text(student.parent.phone);
    $('#verification-parent-email').text(student.parent.email);
    
    // School info
    $('#verification-current-school').text(student.school.name);
    $('#verification-school-address').text(student.school.address);
    
    // Show verification section
    $('#student-verification-result').removeClass('hidden');
    
    // Reset form state
    $('#verification-notes').val('');
    $('#verification-confirm').prop('checked', false);
    $('#approve-application').prop('disabled', true);
}

// Update student status
function updateStudentStatus(studentId, status, reason) {
    const studentIndex = mockStudents.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
        console.error('Student not found:', studentId);
        return;
    }
    
    mockStudents[studentIndex].status.currentStatus = status;
    mockStudents[studentIndex].status.reason = reason;
    mockStudents[studentIndex].status.lastUpdated = new Date().toISOString().split('T')[0];
    
    // If eligible, generate exam info if not exists
    if (status === 'eligible' && !mockStudents[studentIndex].status.examInfo) {
        mockStudents[studentIndex].status.examInfo = {
            sbd: `TS${Math.floor(Math.random() * 900000) + 100000}`,
            room: `P${Math.floor(Math.random() * 10) + 201}`,
            date: "2025-05-20",
            time: "08:00 - 11:30"
        };
    }
}

// Update statistics
function updateStats() {
    const total = mockStudents.length;
    const eligible = mockStudents.filter(s => s.status.currentStatus === 'eligible').length;
    const ineligible = mockStudents.filter(s => s.status.currentStatus === 'ineligible').length;
    const pending = mockStudents.filter(s => s.status.currentStatus === 'pending').length;
    const confirmed = mockStudents.filter(s => s.status.currentStatus === 'confirmed').length;
    
    $('#total-applications').text(total);
    $('#eligible-count').text(eligible);
    $('#ineligible-count').text(ineligible);
    $('#pending-count').text(pending);
    $('#confirmed-count').text(confirmed);
}

// Save new schedule
function saveNewSchedule() {
    const date = $('#schedule-date').val();
    const timeSlots = parseInt($('#schedule-time-slots').val());
    const startTime = $('#schedule-start-time').val();
    const endTime = $('#schedule-end-time').val();
    const maxStudents = parseInt($('#schedule-max-students').val());
    
    // Validation
    if (!date || !timeSlots || !startTime || !endTime || !maxStudents) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }
    
    // Create new schedule
    const newSchedule = {
        id: `SCH${Math.floor(Math.random() * 900) + 100}`,
        date: date,
        timeSlots: []
    };
    
    // Generate time slots
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinute = parseInt(endTime.split(':')[1]);
    
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const minutesPerSlot = Math.floor(totalMinutes / timeSlots);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    for (let i = 0; i < timeSlots; i++) {
        // Calculate slot end time
        let slotEndHour = currentHour;
        let slotEndMinute = currentMinute + minutesPerSlot;
        
        if (slotEndMinute >= 60) {
            slotEndHour += Math.floor(slotEndMinute / 60);
            slotEndMinute = slotEndMinute % 60;
        }
        
        // Format time
        const slotStartTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
        
        // Add time slot
        newSchedule.timeSlots.push({
            time: `${slotStartTime} - ${slotEndTime}`,
            maxStudents: maxStudents,
            currentStudents: 0
        });
        
        // Update current time to next slot start
        currentHour = slotEndHour;
        currentMinute = slotEndMinute;
    }
    
    // Add to mock data
    mockSchedules.push(newSchedule);
    
    // Hide form and reload schedules
    $('#add-schedule-form').addClass('hidden');
    loadSchedules();
    
    // Reset form
    $('#schedule-date').val('');
    $('#schedule-time-slots').val('5');
    $('#schedule-start-time').val('');
    $('#schedule-end-time').val('');
    $('#schedule-max-students').val('10');
    
    alert('Lịch mới đã được tạo thành công!');
}

// Load schedules
function loadSchedules() {
    $('#schedule-list').empty();
    
    if (mockSchedules.length === 0) {
        $('#schedule-list').append(`
            <div class="text-center py-8 text-gray-500">
                Chưa có lịch nộp hồ sơ nào được tạo.
            </div>
        `);
        return;
    }
    
    mockSchedules.forEach(schedule => {
        let timeSlotHtml = '';
        
        schedule.timeSlots.forEach((slot, index) => {
            const isFull = slot.currentStudents >= slot.maxStudents;
            const availabilityClass = isFull ? 'text-red-600' : 'text-green-600';
            const availabilityText = isFull ? 'Đã đầy' : `Còn ${slot.maxStudents - slot.currentStudents} chỗ`;
            
            timeSlotHtml += `
                <div class="flex justify-between items-center p-3 ${index !== schedule.timeSlots.length - 1 ? 'border-b' : ''}">
                    <div class="flex-1">${slot.time}</div>
                    <div class="flex-1 text-center">${slot.currentStudents}/${slot.maxStudents}</div>
                    <div class="flex-1 text-right ${availabilityClass}">${availabilityText}</div>
                </div>
            `;
        });
        
        // Format date
        const scheduleDate = new Date(schedule.date);
        const formattedDate = scheduleDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const scheduleCard = `
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="bg-primary text-white p-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-bold">${formattedDate}</h3>
                        <div class="flex space-x-2">
                            <button class="p-1 hover:bg-blue-800 rounded" title="Gửi thông báo">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <button class="p-1 hover:bg-blue-800 rounded" title="Chỉnh sửa">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button class="p-1 hover:bg-blue-800 rounded" title="Xóa">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-center text-sm font-medium text-gray-500 border-b pb-2 mb-2">
                        <div class="flex-1">Khung giờ</div>
                        <div class="flex-1 text-center">Số lượng</div>
                        <div class="flex-1 text-right">Trạng thái</div>
                    </div>
                    ${timeSlotHtml}
                </div>
            </div>
        `;
        
        $('#schedule-list').append(scheduleCard);
    });
}

// Display transcript results
function displayTranscriptResults(data, containerId) {
    $(`#${containerId}`).empty();
    
    // Add subjects and scores
    let transcriptHtml = '<div class="space-y-2">';
    
    // Add subjects info
    data.subjects.forEach(subject => {
        transcriptHtml += `
            <div class="flex justify-between">
                <span class="font-medium">${subject.name}:</span>
                <span class="text-primary font-bold">${subject.score}</span>
            </div>
        `;
    });
    
    // Add behavior and attendance
    transcriptHtml += `
        <div class="mt-4 pt-2 border-t">
            <div class="flex justify-between">
                <span class="font-medium">Hạnh kiểm:</span>
                <span class="text-primary font-bold">${data.behavior}</span>
            </div>
            <div class="flex justify-between mt-1">
                <span class="font-medium">Tỷ lệ đi học:</span>
                <span class="text-primary font-bold">${data.attendanceRate}</span>
            </div>
            <p class="text-sm text-gray-600 mt-2">${data.teacherComments}</p>
        </div>
    `;
    
    transcriptHtml += '</div>';
    $(`#${containerId}`).append(transcriptHtml);
}

// Helper function to convert relationship code to text
function getRelationshipText(relationship) {
    switch (relationship) {
        case 'father':
            return 'Bố';
        case 'mother':
            return 'Mẹ';
        case 'guardian':
            return 'Người giám hộ';
        default:
            return relationship;
    }
}