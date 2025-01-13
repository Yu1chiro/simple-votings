import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
        import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

        let votingChart = null;

        async function initializeFirebase() {
            try {
                const response = await fetch('/firebase-config');
                const firebaseConfig = await response.json();
                const app = initializeApp(firebaseConfig);
                const database = getDatabase(app);
                
                // Start listening to votes
                listenToVotes(database);
            } catch (error) {
                console.error('Firebase initialization failed:', error);
            }
        }

        function listenToVotes(database) {
            const votesRef = ref(database, 'votes');
            onValue(votesRef, (snapshot) => {
                const votes = [];
                snapshot.forEach((childSnapshot) => {
                    votes.push(childSnapshot.val());
                });
                updateStatistics(votes);
            });
        }

        function updateStatistics(votes) {
            // Count votes per candidate
            const candidateVotes = {};
            let totalVotes = votes.length;

            votes.forEach(vote => {
                candidateVotes[vote.Namecandidate] = (candidateVotes[vote.Namecandidate] || 0) + 1;
            });

            // Update pie chart
            updateChart(candidateVotes, totalVotes);
            
            // Update statistics cards
            updateStatsCards(candidateVotes, totalVotes);
        }

        function updateChart(candidateVotes, totalVotes) {
            const ctx = document.getElementById('votingChart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (votingChart) {
                votingChart.destroy();
            }

            // Prepare data for chart
            const data = {
                labels: Object.keys(candidateVotes),
                datasets: [{
                    data: Object.values(candidateVotes),
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(99, 255, 135, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)'
                    ],
                    borderWidth: 1
                }]
            };

            // Create new chart
            votingChart = new Chart(ctx, {
                type: 'pie',
                data: data,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const percentage = ((value / totalVotes) * 100).toFixed(1);
                                    return `${context.label}: ${value} votes (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        function updateStatsCards(candidateVotes, totalVotes) {
            const statsContainer = document.getElementById('statsContainer');
            statsContainer.innerHTML = '';

            // Total votes card
            const totalVotesDiv = document.createElement('div');
            totalVotesDiv.className = 'bg-blue-50 p-4 rounded-lg';
            totalVotesDiv.innerHTML = `
                <p class="text-blue-800 font-medium">Total Suara</p>
                <p class="text-2xl font-bold text-blue-900">${totalVotes}</p>
            `;
            statsContainer.appendChild(totalVotesDiv);

            // Individual candidate stats
            Object.entries(candidateVotes).forEach(([candidate, votes]) => {
                const percentage = ((votes / totalVotes) * 100).toFixed(1);
                const div = document.createElement('div');
                div.className = 'bg-gray-50 p-4 rounded-lg';
                div.innerHTML = `
                    <p class="text-gray-800 font-medium">${candidate}</p>
                    <p class="text-2xl font-bold text-gray-900">${votes} <span class="text-lg font-normal text-gray-600">(${percentage}%)</span></p>
                `;
                statsContainer.appendChild(div);
            });
        }

        // Initialize when document is loaded
        document.addEventListener('DOMContentLoaded', initializeFirebase);