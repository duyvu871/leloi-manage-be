// Parent Dashboard JavaScript file

// Mock data for demonstration
const mockStudentData = {
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
        currentStatus: "eligible", // eligible, ineligible, pending
        reason: "",
        lastUpdated: "2025-04-15",
        examInfo: {
            sbd: "TS2025001",
            room: "P201",
            date: "2025-05-20",
            time: "08:00 - 11:30"
        }
    }
};

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
        
        // If application status tab is clicked, load the data
        if (targetTab === 'application-status') {
            loadApplicationStatus();
        }
    });
    
    // Handle registration form submission
    $('#registration-form').on('submit', function(e) {
        e.preventDefault();
        
        // In a real app, this would make an API call to save the data
        // For demo, just show a success message
        alert('Thông tin đã được lưu thành công!');
        
        // Store data in localStorage for demo purposes
        const formData = {
            student: {
                name: $('#student-name').val(),
                dob: $('#student-dob').val(),
                gender: $('#student-gender').val(),
                address: $('#student-address').val()
            },
            parent: {
                name: $('#parent-name').val(),
                phone: $('#parent-phone').val(),
                email: $('#parent-email').val(),
                relationship: $('#parent-relationship').val()
            },
            school: {
                name: $('#current-school').val(),
                address: $('#school-address').val()
            }
        };
        
        localStorage.setItem('registrationData', JSON.stringify(formData));
        
        // Update the mock data for demo purposes
        Object.assign(mockStudentData.student, formData.student);
        Object.assign(mockStudentData.parent, formData.parent);
        Object.assign(mockStudentData.school, formData.school);
    });
    
    // Load saved registration data if exists
    const savedData = localStorage.getItem('registrationData');
    if (savedData) {
        const formData = JSON.parse(savedData);
        
        // Fill in the form fields
        $('#student-name').val(formData.student.name);
        $('#student-dob').val(formData.student.dob);
        $('#student-gender').val(formData.student.gender);
        $('#student-address').val(formData.student.address);
        
        $('#parent-name').val(formData.parent.name);
        $('#parent-phone').val(formData.parent.phone);
        $('#parent-email').val(formData.parent.email);
        $('#parent-relationship').val(formData.parent.relationship);
        
        $('#current-school').val(formData.school.name);
        $('#school-address').val(formData.school.address);
    } else {
        // Use mock data for demonstration
        $('#student-name').val(mockStudentData.student.name);
        $('#student-dob').val(mockStudentData.student.dob);
        $('#student-gender').val(mockStudentData.student.gender);
        $('#student-address').val(mockStudentData.student.address);
        
        $('#parent-name').val(mockStudentData.parent.name);
        $('#parent-phone').val(mockStudentData.parent.phone);
        $('#parent-email').val(mockStudentData.parent.email);
        $('#parent-relationship').val(mockStudentData.parent.relationship);
        
        $('#current-school').val(mockStudentData.school.name);
        $('#school-address').val(mockStudentData.school.address);
    }
    
    // Document upload handlers
    setupDocumentUpload();
    
    // Initial app status tab
    loadApplicationStatus();
});

// Set up document upload functionality
function setupDocumentUpload() {
    // Transcript upload
    $('#transcript-upload-area').on('click', function() {
        $('#transcript-upload').click();
    });
    
    $('#transcript-upload').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Show file preview
            $('#transcript-preview').removeClass('hidden');
            $('#transcript-filename').text(file.name);
            
            // Simulate file processing/extraction with a delay
            setTimeout(function() {
                // In a real app, this would be actual data extraction
                displayExtractedInfo(mockStudentData.transcriptData);
            }, 1000);
        }
    });
    
    $('#remove-transcript').on('click', function() {
        $('#transcript-upload').val('');
        $('#transcript-preview').addClass('hidden');
        $('#extracted-info').empty();
    });
    
    // Certificate upload
    $('#certificate-upload-area').on('click', function() {
        $('#certificate-upload').click();
    });
    
    $('#certificate-upload').on('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            // Show file previews
            $('#certificate-previews').removeClass('hidden');
            
            // Clear previous previews
            $('#certificate-previews').empty();
            
            // Add each file to preview
            Array.from(files).forEach(file => {
                const filePreview = `
                    <div class="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>${file.name}</span>
                        </div>
                        <button class="remove-certificate text-red-500 hover:text-red-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                `;
                
                $('#certificate-previews').append(filePreview);
            });
        } else {
            $('#certificate-previews').addClass('hidden');
        }
    });
    
    // Delegate event for dynamically created remove buttons
    $(document).on('click', '.remove-certificate', function() {
        $(this).closest('div').remove();
        
        // If no more certificates, hide the container
        if ($('#certificate-previews').children().length === 0) {
            $('#certificate-previews').addClass('hidden');
        }
    });
    
    // Save documents button
    $('#save-documents').on('click', function() {
        // Check if transcript is uploaded
        if ($('#transcript-upload').val() === '') {
            alert('Vui lòng tải lên học bạ');
            return;
        }
        
        // In a real app, this would make an API call to save the documents
        alert('Tài liệu đã được lưu thành công!');
        
        // Mark documents as uploaded for demo
        localStorage.setItem('documentsUploaded', 'true');
    });
}

// Display extracted information from transcript
function displayExtractedInfo(data) {
    $('#extracted-info').empty();
    
    // Add subjects and scores
    data.subjects.forEach(subject => {
        const subjectHtml = `
            <div class="p-2">
                <div class="flex justify-between">
                    <span class="font-medium">${subject.name}:</span>
                    <span class="text-primary font-bold">${subject.score}</span>
                </div>
                <p class="text-sm text-gray-600">${subject.evaluation}</p>
            </div>
        `;
        
        $('#extracted-info').append(subjectHtml);
    });
    
    // Add behavior and attendance
    const behaviorHtml = `
        <div class="p-2 border-t">
            <div class="flex justify-between">
                <span class="font-medium">Hạnh kiểm:</span>
                <span class="text-primary font-bold">${data.behavior}</span>
            </div>
            <div class="flex justify-between mt-1">
                <span class="font-medium">Tỷ lệ đi học:</span>
                <span class="text-primary font-bold">${data.attendanceRate}</span>
            </div>
            <p class="text-sm text-gray-600 mt-2">Nhận xét: ${data.teacherComments}</p>
        </div>
    `;
    
    $('#extracted-info').append(behaviorHtml);
}

// Load application status
function loadApplicationStatus() {
    // Show loading first
    $('#status-loading').removeClass('hidden');
    $('#status-content').addClass('hidden');
    
    // Simulate API call with a delay
    setTimeout(function() {
        $('#status-loading').addClass('hidden');
        $('#status-content').removeClass('hidden');
        
        // Update page with student info
        updateStatusInfo();
    }, 1000);
}

// Update the status tab with student information
function updateStatusInfo() {
    // Student info
    $('#summary-student-name').text(mockStudentData.student.name);
    
    // Format date for display
    const dob = new Date(mockStudentData.student.dob);
    $('#summary-student-dob').text(dob.toLocaleDateString('vi-VN'));
    
    // Gender display
    $('#summary-student-gender').text(mockStudentData.student.gender === 'male' ? 'Nam' : 'Nữ');
    
    // Parent info
    $('#summary-parent-name').text(mockStudentData.parent.name);
    $('#summary-parent-contact').text(`${mockStudentData.parent.phone} | ${mockStudentData.parent.email}`);
    
    // School info
    $('#summary-current-school').text(mockStudentData.school.name);
    
    // Transcript results
    $('#summary-transcript-results').empty();
    
    const documentsUploaded = localStorage.getItem('documentsUploaded') === 'true';
    
    if (documentsUploaded) {
        // Display transcript data
        let transcriptHtml = '<div class="space-y-2">';
        
        // Add subjects info
        mockStudentData.transcriptData.subjects.forEach(subject => {
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
                    <span class="text-primary font-bold">${mockStudentData.transcriptData.behavior}</span>
                </div>
                <div class="flex justify-between mt-1">
                    <span class="font-medium">Tỷ lệ đi học:</span>
                    <span class="text-primary font-bold">${mockStudentData.transcriptData.attendanceRate}</span>
                </div>
            </div>
        `;
        
        transcriptHtml += '</div>';
        $('#summary-transcript-results').append(transcriptHtml);
    } else {
        // Show upload reminder
        $('#summary-transcript-results').append(`
            <p class="text-yellow-600">Bạn chưa tải lên học bạ. Vui lòng tải lên học bạ để xem kết quả trích xuất.</p>
        `);
    }
    
    // Status badge
    const status = mockStudentData.status.currentStatus;
    $('#status-badge').removeClass('bg-green-600 bg-red-600 bg-yellow-500 bg-blue-600');
    
    if (status === 'eligible') {
        $('#status-badge').addClass('bg-green-600').text('Đủ điều kiện');
        $('#admission-result').removeClass('hidden');
        $('#result-eligible').removeClass('hidden');
        $('#result-ineligible').addClass('hidden');
        $('#result-pending').addClass('hidden');
        $('#exam-info').removeClass('hidden');
        
        // Update exam info
        $('#exam-sbd').text(mockStudentData.status.examInfo.sbd);
        $('#exam-room').text(mockStudentData.status.examInfo.room);
        $('#exam-date').text(mockStudentData.status.examInfo.date);
        $('#exam-time').text(mockStudentData.status.examInfo.time);
    } else if (status === 'ineligible') {
        $('#status-badge').addClass('bg-red-600').text('Không đủ điều kiện');
        $('#admission-result').removeClass('hidden');
        $('#result-eligible').addClass('hidden');
        $('#result-ineligible').removeClass('hidden');
        $('#result-pending').addClass('hidden');
        $('#exam-info').addClass('hidden');
        
        // Update reason
        $('#ineligible-reason').text(mockStudentData.status.reason || 'Không đáp ứng đủ yêu cầu tuyển sinh');
    } else if (status === 'pending') {
        $('#status-badge').addClass('bg-yellow-500').text('Đang xử lý');
        $('#admission-result').removeClass('hidden');
        $('#result-eligible').addClass('hidden');
        $('#result-ineligible').addClass('hidden');
        $('#result-pending').removeClass('hidden');
        $('#exam-info').addClass('hidden');
    } else {
        // If status is processing or anything else
        $('#status-badge').addClass('bg-blue-600').text('Đang xử lý');
        $('#admission-result').addClass('hidden');
        $('#exam-info').addClass('hidden');
    }
    
    // Last updated date
    const lastUpdated = new Date(mockStudentData.status.lastUpdated);
    $('#status-date').text(`Cập nhật: ${lastUpdated.toLocaleDateString('vi-VN')}`);
}