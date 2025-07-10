// Example usage of the SingleEliminationBracket component

import React, { useState, useEffect } from 'react';
import SingleEliminationBracket from '@/components/SingleEliminationBracket';

// Example 1: Basic usage with 7 participants
const participants7 = [
  { id: 1, name: 'Alice Johnson', profilePicture: '/images/alice.jpg' },
  { id: 2, name: 'Bob Smith', profilePicture: '/images/bob.jpg' },
  { id: 3, name: 'Charlie Davis', profilePicture: '/images/charlie.jpg' },
  { id: 4, name: 'Diana Miller', profilePicture: '/images/diana.jpg' },
  { id: 5, name: 'Eve Wilson', profilePicture: '/images/eve.jpg' },
  { id: 6, name: 'Frank Brown', profilePicture: '/images/frank.jpg' },
  { id: 7, name: 'Grace Lee', profilePicture: '/images/grace.jpg' }
];

// This will generate:
// - 8-person bracket (next power of 2)
// - 1 BYE in Round 1
// - 3 total rounds (Round 1, Semifinal, Final)
// - Random seeding

export function Example1() {
  return (
    <div>
      <h3>7-Person Tournament (1 BYE)</h3>
      <SingleEliminationBracket 
        participants={participants7}
        className="mb-8"
      />
    </div>
  );
}

// Example 2: Power of 2 participants (no BYEs)
const participants8 = [
  { id: 1, name: 'Alice Johnson' },
  { id: 2, name: 'Bob Smith' },
  { id: 3, name: 'Charlie Davis' },
  { id: 4, name: 'Diana Miller' },
  { id: 5, name: 'Eve Wilson' },
  { id: 6, name: 'Frank Brown' },
  { id: 7, name: 'Grace Lee' },
  { id: 8, name: 'Henry Chen' }
];

// This will generate:
// - 8-person bracket (perfect power of 2)
// - 0 BYEs
// - 3 total rounds (Quarterfinal, Semifinal, Final)
// - Random seeding

export function Example2() {
  return (
    <div>
      <h3>8-Person Tournament (No BYEs)</h3>
      <SingleEliminationBracket 
        participants={participants8}
        className="mb-8"
      />
    </div>
  );
}

// Example 3: Large tournament with many BYEs
const participants5 = [
  { id: 1, name: 'Player 1' },
  { id: 2, name: 'Player 2' },
  { id: 3, name: 'Player 3' },
  { id: 4, name: 'Player 4' },
  { id: 5, name: 'Player 5' }
];

// This will generate:
// - 8-person bracket (next power of 2)
// - 3 BYEs in Round 1
// - 3 total rounds (Round 1, Semifinal, Final)
// - Random seeding

export function Example3() {
  return (
    <div>
      <h3>5-Person Tournament (3 BYEs)</h3>
      <SingleEliminationBracket 
        participants={participants5}
        className="mb-8"
      />
    </div>
  );
}

// Example 4: Dynamic participants from API
export function DynamicExample() {
  const [participants, setParticipants] = useState<any[]>([]);
  
  useEffect(() => {
    // Fetch participants from API
    fetch('/api/tournament/123/participants')
      .then(res => res.json())
      .then(data => {
        // Transform API data to component format
        const formattedParticipants = data.map((p: any) => ({
          id: p.user_id,
          name: p.display_name,
          profilePicture: p.profile_picture
        }));
        setParticipants(formattedParticipants);
      });
  }, []);
  
  return (
    <div>
      <h3>Dynamic Tournament from API</h3>
      {participants.length > 0 ? (
        <SingleEliminationBracket 
          participants={participants}
          className="mb-8"
        />
      ) : (
        <div>Loading tournament...</div>
      )}
    </div>
  );
}

// Example 5: Custom styling
export function CustomStyledExample() {
  return (
    <div className="bg-purple-900/20 p-6 rounded-lg">
      <h3 className="text-purple-400 mb-4">Custom Styled Tournament</h3>
      <SingleEliminationBracket 
        participants={participants7}
        className="custom-bracket-theme"
      />
    </div>
  );
}

/*
COMPONENT FEATURES:

✅ Supports any number of participants dynamically
✅ Handles BYEs in Round 1 if participant count is not a power of 2
✅ Uses bracketSize = 2^ceil(log2(N)) formula
✅ Calculates numberOfByes = bracketSize - N
✅ In Round 1: Creates matches with participant vs. null for BYEs
✅ Visually displays the remaining participant's name in BYE matches
✅ Correctly advances participants from BYE matches automatically
✅ In future rounds: Does not create false BYE matches
✅ Ensures only actual participants advance
✅ Uses clean internal structure for rounds
✅ Shuffles participants randomly before seeding
✅ Renders bracket visually in columns (each column = round)
✅ Each row = match displaying player1 vs player2
✅ Shows "BYE" but clearly indicates who advanced
✅ Uses clean, readable, and well-commented code
✅ Explains how BYEs are assigned and advanced
✅ Explains how rounds are generated
✅ Explains why false BYEs are avoided
✅ Does not use external libraries for bracket generation logic

TECHNICAL IMPLEMENTATION:

1. Bracket Size Calculation:
   - Uses Math.pow(2, Math.ceil(Math.log2(numParticipants)))
   - Ensures bracket size is always a power of 2

2. BYE Handling:
   - BYEs only occur in Round 1
   - Represented as matches with one participant vs. null
   - Winner is automatically set to the participant
   - Status is marked as 'bye' for visual indication

3. Round Generation:
   - Round 1: Places all participants, assigns BYEs
   - Subsequent rounds: Empty matches waiting for results
   - Proper round naming (Round 1, Quarterfinal, Semifinal, Final)

4. Visual Layout:
   - Columns represent rounds
   - Exponential spacing between matches in later rounds
   - Clear visual distinction between normal matches and BYEs
   - Responsive design with horizontal scrolling

5. Randomization:
   - Fisher-Yates shuffle algorithm
   - Prevents predictable matchups
   - Applied before seeding into Round 1
*/
