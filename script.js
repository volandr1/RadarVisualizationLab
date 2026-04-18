const SPEED_OF_LIGHT = 300000; // км/с [cite: 25]
let allDistances = [];
let allAngles = [];
let allPowers = [];

// Початкова ініціалізація графіка Plotly [cite: 87, 93]
const layout = {
    polar: {
        // Налаштування радіальної осі (відстань)
        radialaxis: {
            visible: true,
            range: [0, 200],
            title: "км",
            color: "#ffffff", // Білий колір тексту/цифр
            gridcolor: "rgba(255, 255, 255, 0.2)", // Напівпрозора сітка
            showline: true,
            tickfont: { size: 10 }
        },
        // Налаштування кутової осі (градуси)
        angularaxis: {
            direction: "clockwise",
            period: 360,
            color: "#ffffff",
            gridcolor: "rgba(255, 255, 255, 0.2)", // Напівпрозора сітка
            linecolor: "rgba(255, 255, 255, 0.5)"
        },
        // ВАЖЛИВО: Прозорий фон самої полярної області
        bgcolor: "rgba(0, 0, 0, 0.5)"
    },
    showlegend: false,
    // ВАЖЛИВО: Прозорий фон всього полотна
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "white" },
    margin: { t: 40, b: 40, l: 40, r: 40 }
};

Plotly.newPlot('radar-plot', [{
    type: "scatterpolar",
    mode: "markers",
    r: [],
    theta: [],
    marker: { color: [], colorscale: 'Viridis', size: 8 }
}], layout);

// Функція для зміни параметрів через API [cite: 66, 91, 98]
async function updateConfig() {
    const config = {
        measurementsPerRotation: parseInt(document.getElementById('measurementsPerRotation').value),
        rotationSpeed: parseInt(document.getElementById('rotationSpeed').value),
        targetSpeed: parseInt(document.getElementById('targetSpeed').value)
    };

    try {
        const response = await fetch('http://localhost:4000/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        if (response.ok) {
            alert('Конфігурацію оновлено успішно!');
        } else {
            alert('Помилка при оновленні конфігурації');
        }
    } catch (error) {
        console.error('Помилка API:', error);
        alert('Не вдалося з’єднатися з API сервісу');
    }
}

// WebSocket підключення [cite: 50, 51, 86, 96]
const socket = new WebSocket('ws://localhost:4000');

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const currentAngle = message.scanAngle;

    // Очищення при повному оберті
    if (currentAngle < 2) {
        allDistances = [];
        allAngles = [];
        allPowers = [];
    }

    if (message.echoResponses.length > 0) {
        message.echoResponses.forEach(echo => {
            const distance = (SPEED_OF_LIGHT * echo.time) / 2; // [cite: 22, 82]
            allDistances.push(distance);
            allAngles.push(currentAngle); // [cite: 79, 90]
            allPowers.push(echo.power); // [cite: 83, 94]
        });

        Plotly.react('radar-plot', [{
            type: "scatterpolar",
            mode: "markers",
            r: allDistances,
            theta: allAngles,
            marker: { color: allPowers, colorscale: 'Viridis', size: 8 }
        }], layout);
    }
};

socket.onopen = () => document.getElementById('status').style.color = '#4caf50';
socket.onclose = () => document.getElementById('status').style.color = '#f44336';