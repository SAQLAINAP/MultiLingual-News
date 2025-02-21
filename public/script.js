

let selectedCategory = "";

// Add event listener for the "Fetch News" button
document.getElementById('fetch-news-button').addEventListener('click', async () => {
    await fetchAndDisplayNews();
});

// Add event listeners for category buttons
document.querySelectorAll('.category-button').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
        // Add active class to the clicked button
        button.classList.add('active');
        // Set the selected category
        selectedCategory = button.getAttribute('data-category');
    });
});

// Add event listener for the "Summarize News" button
document.getElementById('summarize-button').addEventListener('click', async () => {
    await summarizeNews();
    document.getElementById('summary-box').style.display = 'block'; // Show summary box
});

// Add event listener for the "Generate Audio" button
document.getElementById('generate-audio-button').addEventListener('click', async () => {
    await generateAudio();
});

// Function to fetch and display news
async function fetchAndDisplayNews() {
    const keyword = document.getElementById('search-box').value;
    const category = selectedCategory;

    if (!keyword) {
        alert("Please enter a keyword!");
        return;
    }

    try {
        const response = await fetch(`/fetch-news?keyword=${encodeURIComponent(keyword)}&category=${category}`);
        const data = await response.json();
        if (data.success) {
            displayNews(data);
            document.getElementById('action-buttons').style.display = 'flex'; // Show action buttons
        } else {
            alert('Failed to fetch news.');
        }
    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

// Function to display news articles
function displayNews(data) {
    const newsResults = document.getElementById('news-results');
    newsResults.innerHTML = ''; // Clear previous results

    data.articles.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.classList.add('news-item');

        const title = document.createElement('h2');
        title.textContent = article.title;

        const description = document.createElement('p');
        description.textContent = article.description || "No description available.";

        const link = document.createElement('a');
        link.href = article.url;
        link.textContent = 'Read more';
        link.target = '_blank';

        articleElement.appendChild(title);
        articleElement.appendChild(description);
        articleElement.appendChild(link);

        newsResults.appendChild(articleElement);
    });
}

// Function to summarize news
async function summarizeNews() {
    try {
        const response = await fetch('/summarize-news');
        const data = await response.json();
        if (data.success) {
            displaySummary(data.summaries);
        } else {
            alert('Failed to summarize news.');
        }
    } catch (error) {
        console.error('Error summarizing news:', error);
    }
}

// Function to display summaries
function displaySummary(summaries) {
    const summaryList = document.getElementById('summary-list');
    summaryList.innerHTML = ''; // Clear previous summaries

    summaries.forEach(summary => {
        const listItem = document.createElement('li');
        listItem.textContent = summary;
        summaryList.appendChild(listItem);
    });
}

// Function to generate audio
// Function to generate audio
async function generateAudio() {
    try {
        const response = await fetch('/generate-audio');
        const data = await response.json();
        if (data.success) {
            alert('Audio generated successfully!');
            displayAudioPlayer(data.audioUrl);
        } else {
            alert('Failed to generate audio.');
        }
    } catch (error) {
        console.error('Error generating audio:', error);
    }
}

// Function to display the audio player
function displayAudioPlayer(audioUrl) {
    const audioPlayer = document.createElement('audio');
    audioPlayer.controls = true;
    audioPlayer.src = audioUrl;
    document.getElementById('news-results').appendChild(audioPlayer);
}

// Function to display audio players
// function displayAudioPlayers(articles) {
//     const newsResults = document.getElementById('news-results');

//     articles.forEach(article => {
//         if (article.audioUrl) {
//             const audioPlayer = document.createElement('audio');
//             audioPlayer.controls = true;
//             audioPlayer.src = article.audioUrl;
//             newsResults.appendChild(audioPlayer);
//         }
//     });
// }