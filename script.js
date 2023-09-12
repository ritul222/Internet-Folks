
function displayOutput(content) {
    const outputElement = document.getElementById("output");
    if (outputElement) {
        outputElement.innerHTML = content;
    }
}

document.getElementById("viewCommunities").addEventListener("click", () => {
    displayOutput("Communities: " + communities.join(", "));
});



document.getElementById("createCommunity").addEventListener("click", () => {
    const newCommunityName = prompt("Enter the name of the new community:");
    if (newCommunityName !== null && newCommunityName.trim() !== "") {
      // Send a POST request to create a new community
      fetch('/createCommunity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ communityName: newCommunityName }),
      })
      .then(response => response.json())
      .then(data => {
        // Handle the response from the server
        console.log(data);
        displayOutput("Community created: " + newCommunityName);
      })
      .catch(error => {
        console.error('Error creating community:', error);
        displayOutput("Error occurred while creating the community.");
      });
    } else {
      displayOutput("Invalid community name.");
    }
  });
  



// Function to fetch and display community names
function fetchCommunityNames() {
    fetch('/getCommunities')
      .then(response => response.json())
      .then(data => {
        const communityNames = data.join(', ');
        displayOutput("Communities: " + communityNames);
      })
      .catch(error => {
        console.error('Error fetching community names:', error);
        displayOutput("Error occurred while fetching community names.");
      });
  }
  
  document.getElementById("viewCommunities").addEventListener("click", fetchCommunityNames);


  document.getElementById('addMember').addEventListener('click', () => {
    const selectedCommunity = prompt('Enter the name of the community to add a member to:');
    const newMember = prompt('Enter the name of the member to add:');
  
    if (selectedCommunity && newMember) {
      fetch('/addMember', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ communityName: selectedCommunity, memberName: newMember }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Error adding member: ' + response.statusText);
          }
        })
        .then((data) => {
          console.log(data.message);
          displayOutput('Member added to ' + selectedCommunity + ': ' + newMember);
        })
        .catch((error) => {
          console.error('Error adding member:', error);
          displayOutput('Error occurred while adding the member.');
        });
    } else {
      displayOutput('Invalid input.');
    }
  });
  


  
  document.addEventListener("DOMContentLoaded", () => {
    // Function to display output
    function displayOutput(content) {
      const outputElement = document.getElementById("output");
      if (outputElement) {
        outputElement.innerHTML = content;
      }
    }
  
    // Function to send a POST request to remove a member from a community
    function removeMemberFromCommunity(communityName, memberUsername) {
      const data = { communityName, memberUsername };
  
      fetch('/removeMember', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        // Handle the response data here
        if (data.message) {
          displayOutput(data.message);
        } else if (data.error) {
          displayOutput(`Error removing member: ${data.error}`);
        } else {
          displayOutput('Unexpected response from the server.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        displayOutput('Error occurred while removing the member.');
      });
    }
  
    // Add event listeners for the buttons
    document.getElementById("removeMember").addEventListener("click", () => {
      const communityName = prompt('Enter the name of the community to remove a member from:');
      const memberUsername = prompt('Enter the name of the member to remove:');
  
      if (communityName && memberUsername) {
        removeMemberFromCommunity(communityName, memberUsername);
      } else {
        displayOutput('Invalid input.');
      }
    });
  });
  



  document.addEventListener("DOMContentLoaded", () => {
    // Function to display output
    function displayOutput(content) {
      const outputElement = document.getElementById("output");
      if (outputElement) {
        outputElement.innerHTML = content;
      }
    }
  
    // Function to send a GET request to fetch and display community members
    function fetchCommunityMembers(communityName) {
      // Make sure to include the communityName as a query parameter
      const url = `/getCommunityMembers?communityName=${encodeURIComponent(communityName)}`;
  
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.members.length > 0) {
            const memberList = data.members.join(', ');
            displayOutput(`Community Members: ${memberList}`);
          } else {
            displayOutput('No members found in the community.');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          displayOutput('Error occurred while fetching community members.');
        });
    }
  
    // Add event listener for the "View Community Members" button
    document.getElementById("viewCommunityMembers").addEventListener("click", () => {
      // Get the community name entered by the user
      const communityName = prompt("Enter the name of the community to view members:");
  
      // Check if a community name was entered
      if (communityName !== null && communityName.trim() !== "") {
        fetchCommunityMembers(communityName);
      } else {
        displayOutput("Invalid community name.");
      }
    });
  });
  


document.getElementById("joinCommunity").addEventListener("click", () => {
  // Prompt the user for community and member names
  const communityName = prompt("Enter the name of the community you want to join:");
  const memberName = prompt("Enter your name:");

  // Check if both values are entered
  if (communityName && memberName) {
      // Create an object with the data to send to the server
      const requestData = {
          communityName: communityName,
          memberName: memberName
      };

      // Send an HTTP POST request to the server
      fetch('/joinCommunity', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
      })
      .then(response => response.json())
      .then(data => {
          // Handle the response from the server
          console.log(data); // This can be a success message from the server
          // Display a success message to the user
          displayOutput(data.message);
      })
      .catch(error => {
          console.error('Error joining community:', error);
          // Handle the error, such as displaying an error message to the user
          displayOutput('Error joining community: ' + error.message);
      });
  } else {
      // Handle the case where the user didn't enter both values
      console.log("User did not enter both values.");
      // Display an error message to the user
      displayOutput("Please enter both community and member names.");
  }
});

document.getElementById("viewCommunityMembers").addEventListener("click", () => {
  // Get the community name entered by the user
  const communityName = prompt("Enter the name of the community to view members:");

  // Check if a community name was entered
  if (communityName !== null && communityName.trim() !== "") {
      fetchCommunityMembers(communityName);
  } else {
      // Display an error message to the user
      displayOutput("Invalid community name.");
  }
});
