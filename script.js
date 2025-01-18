document.getElementById("fileInput").addEventListener("change", handleFile);

let questions = [];

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const arrayBuffer = e.target.result;

        // Sử dụng Mammoth.js để đọc file Word
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then(function (result) {
                parseQuestions(result.value);
            })
            .catch(function (err) {
                console.error("Lỗi đọc file:", err);
            });
    };

    reader.readAsArrayBuffer(file);
}

function parseQuestions(content) {
    const lines = content.split("\n");
    let currentQuestion = {};
    questions = [];

    lines.forEach((line) => {
        line = line.trim();

        if (line.match(/^\d+\./)) {
            // Dòng bắt đầu là câu hỏi
            if (currentQuestion.question) {
                questions.push(currentQuestion);
            }
            currentQuestion = { question: line, options: [], answer: "" };
        } else if (line.match(/^[A-C]\./)) {
            // Dòng bắt đầu là lựa chọn
            currentQuestion.options.push(line);
        } else if (line.startsWith("Đáp án:")) {
            // Dòng chứa đáp án
            currentQuestion.answer = line.replace("Đáp án:", "").trim();
        }
    });

    if (currentQuestion.question) {
        questions.push(currentQuestion);
    }

    displayQuestions();
}

function displayQuestions() {
    const container = document.getElementById("quizContainer");
    container.innerHTML = "";

    questions.forEach((question, index) => {
        const div = document.createElement("div");
        div.classList.add("question");
        div.innerHTML = `
           <p>${question.question}</p>
            ${question.options.map(
                (option) =>
                    `<label><input type="radio" name="q${index}" value="${option[0]}"> ${option}</label><br>`
            ).join("")}
        `;
        container.appendChild(div);
    });

    document.getElementById("submitQuiz").style.display = "block";
    document.getElementById("restartQuiz").style.display = "block";  // Hiển thị nút làm lại
    setupSubmitButton();
    setupRestartButton(); // Đặt sự kiện cho nút làm lại
}

function setupSubmitButton() {
    const submitButton = document.getElementById("submitQuiz");
    submitButton.addEventListener("click", function () {
        let score = 0;
        let wrongAnswers = []; // Danh sách các câu trả lời sai
        let unansweredQuestions = []; // Câu chưa trả lời

        questions.forEach((question, index) => {
            const selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
            if (selectedOption) {
                if (selectedOption.value === question.answer) {
                    score++;
                } else {
                    wrongAnswers.push({
                        question: question.question,
                        correctAnswer: question.answer,
                        selectedAnswer: selectedOption.value,
                    });
                }
            } else {
                unansweredQuestions.push(question);
            }
        });

        // Hiển thị kết quả
        document.getElementById("result").innerHTML = `
            Bạn trả lời đúng ${score}/${questions.length} câu.
        `;

        if (wrongAnswers.length > 0) {
            const wrongList = wrongAnswers.map((item) => `
                <p><b></b> ${item.question}</p>
                <p>- Đáp án đúng: <span style="color: green;">${item.correctAnswer}</span></p>
                <p>- Bạn đã chọn: <span style="color: red;">${item.selectedAnswer}</span></p>
            `).join("");

            document.getElementById("result").innerHTML += `
                <h3>Danh sách câu trả lời sai:</h3>
                ${wrongList}
            `;
        }

        // Hiển thị nút điều khiển
        if (unansweredQuestions.length > 0 || wrongAnswers.length > 0) {
            document.getElementById("controlPanel").style.display = "block";
            document.getElementById("continueQuiz").style.display = unansweredQuestions.length > 0 ? "inline-block" : "none";
            document.getElementById("reviewWrong").style.display = wrongAnswers.length > 0 ? "inline-block" : "none";
        }

        // Ẩn nút "Nộp bài" sau khi đã nộp
        submitButton.style.display = "none";
    });
}

function setupRestartButton() {
    const restartButton = document.getElementById("restartQuiz");
    restartButton.addEventListener("click", function () {
        // Xóa tất cả các lựa chọn đã chọn
        const allInputs = document.querySelectorAll('input[type="radio"]');
        allInputs.forEach(input => input.checked = false);

        // Ẩn kết quả và panel điều khiển, nhưng không ẩn nút làm lại
        document.getElementById("result").innerHTML = '';
        document.getElementById("submitQuiz").style.display = "block"; // Hiển thị lại nút Nộp bài
        document.getElementById("restartQuiz").style.display = "block"; // Giữ lại nút làm lại
        document.getElementById("controlPanel").style.display = "none"; // Ẩn panel điều khiển
    });
}
