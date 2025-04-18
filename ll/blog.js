document.addEventListener('DOMContentLoaded', function() {
  const news = JSON.parse(localStorage.getItem('news')) || [];
  const container = document.getElementById('blogNewsContainer');

  if (news.length === 0) {
    container.innerHTML = '<p class="text-center">Новостей пока нет</p>';
    return;
  }

  news.forEach(item => {
    const newsItem = document.createElement('div');
    newsItem.className = 'col-md-6 mb-4';
    newsItem.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <h3 class="card-title">${item.title}</h3>
          <p class="card-text text-muted">${new Date(item.date).toLocaleDateString()}</p>
          <p class="card-text">${item.content}</p>
        </div>
      </div>
    `;
    container.appendChild(newsItem);
  });
});