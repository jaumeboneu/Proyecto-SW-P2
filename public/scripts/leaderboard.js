
window.onload = async function() {
    // Define the ranges and their order
    fetch('/getAllBadges')
        .then(response => response.json())
        .then(data => {
            console.log("Datos recibidos del servidor:", data);
            const badges = data
            console.log(badges)
            const ranges = badges.map(badge => {return badge.rango})
            console.log(ranges)
            Promise.all([
                fetch('/scripts/badges.json').then(res => res.json()),
                fetch('/api/leaderboard').then(res => res.json())
            ])
                .then(([badgesData, leaderboardData]) => {
                    console.log(leaderboardData.leaderboard.username)
                    const container = document.getElementById('leaderboard-table');

                    // Create a section for each range
                    ranges.forEach(range => {
                        const section = document.createElement('div');
                        section.className = 'range-section';

                        // Add range title
                        const title = document.createElement('div');
                        title.className = 'range-title';
                        title.textContent = range;
                        section.appendChild(title);

                        // Create table
                        const table = document.createElement('table');
                        const thead = document.createElement('thead');
                        thead.innerHTML = `
                <tr>
                    <th>Rank</th>
                    <th>Username</th>
                    <th>Score</th>
                    <th>Badge</th>
                    <th>Range</th>
                </tr>
            `;
                        table.appendChild(thead);

                        // Find users for this range
                        const usersInRange = Object.values(leaderboardData.leaderboard)
                            .flat()
                            .filter(user => {
                                const badge = badgesData.find(b =>
                                    Number(user.score) >= Number(b.bitpoints_min) &&
                                    (!b.bitpoints_max || Number(user.score) <= Number(b.bitpoints_max))
                                );
                                return badge && badge.rango === range;
                            })
                            .sort((a, b) => b.score - a.score);

                        if (usersInRange.length === 0) {
                            // If no users in this range, show message
                            const tbody = document.createElement('tbody');
                            const row = document.createElement('tr');
                            const cell = document.createElement('td');
                            cell.colSpan = 5;
                            cell.className = 'no-users';
                            cell.textContent = 'No users in this range yet.';
                            row.appendChild(cell);
                            tbody.appendChild(row);
                            table.appendChild(tbody);
                        } else {
                            // Add users to table
                            const tbody = document.createElement('tbody');
                            usersInRange.forEach((user, index) => {
                                const badge = badgesData.find(b =>
                                    user.score >= b.bitpoints_min &&
                                    (!b.bitpoints_max || user.score <= b.bitpoints_max)
                                );

                                const row = document.createElement('tr');
                                row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${user.username}</td>
                        <td>${user.score}</td>
                        <td><img src="/badges/${badge.png}" alt="${badge.rango}" style="width: 20px; height: 20px;"></td>
                        <td>${range}</td>
                    `;
                                tbody.appendChild(row);
                            });
                            table.appendChild(tbody);
                        }

                        section.appendChild(table);
                        container.appendChild(section);
                    });
                })
                .catch(error => {
                    console.error('Error loading data:', error);
                });
        })
        .catch(error => {
            console.error(error);
        });
   //const ranges = ['Observador', 'Aspirante a Cadete', 'Cadete', 'Cadete1', 'Cadete2', 'Cadete3', 'Aspirante a padawan', 'Aspirante a padawan 1', 'Aspirante a padawan 2', 'Aspirante a padawan 3', 'Padawan', 'Padawan 1', 'Padawan 2', 'Padawan 3', 'Aspirante a jedi', 'Aspirante a jedi 1', 'Aspirante a jedi 2', 'Aspirante a jedi 3', 'Jedi', 'Jedi 1', 'Jedi 2', 'Jedi 3', 'Caballero Jedi'];
    //const badges = getAllBadges()




};