# Single Elimination Tournament Bracket Component

A React component that generates and displays a single-elimination tournament bracket based on a dynamic list of participants.

## Features

### ✅ Dynamic Participant Support
- Supports any number of participants (minimum 2)
- Automatically calculates bracket size using `2^ceil(log2(N))`
- Handles odd participant counts with proper BYE allocation

### ✅ BYE Handling
- **Round 1 BYEs**: Creates matches with participant vs. null
- **Visual BYE Display**: Shows who advanced with clear indication
- **Automatic Advancement**: BYE recipients automatically advance to next round
- **No False BYEs**: Prevents false BYE matches in later rounds

### ✅ Bracket Structure
- **Clean Internal Structure**: Organized by rounds and matches
- **Proper Round Naming**: Round 1, Quarterfinal, Semifinal, Final
- **Correct Advancement**: Only real participants advance through rounds

### ✅ Randomization
- **Participant Shuffling**: Uses Fisher-Yates algorithm
- **Prevents Predictable Matchups**: Random seeding before bracket generation
- **Fair Tournament**: Ensures balanced competition

### ✅ Visual Display
- **Column Layout**: Each column represents a round
- **Row Layout**: Each row represents a match
- **Proper Spacing**: Exponential spacing for visual clarity
- **Responsive Design**: Works on different screen sizes
- **Clear Indicators**: BYE matches clearly marked

### ✅ Code Quality
- **Clean Code**: Well-commented and readable
- **TypeScript**: Full type safety
- **No External Dependencies**: Pure React implementation
- **Reusable Component**: Easy to integrate anywhere

## Installation

```bash
# Copy the component to your project
cp SingleEliminationBracket.tsx src/components/
```

## Usage

### Basic Usage

```tsx
import SingleEliminationBracket from '@/components/SingleEliminationBracket';

const participants = [
  { id: 1, name: 'Alice Johnson', profilePicture: '/images/alice.jpg' },
  { id: 2, name: 'Bob Smith', profilePicture: '/images/bob.jpg' },
  { id: 3, name: 'Charlie Davis', profilePicture: '/images/charlie.jpg' },
  { id: 4, name: 'Diana Miller', profilePicture: '/images/diana.jpg' },
  { id: 5, name: 'Eve Wilson', profilePicture: '/images/eve.jpg' },
  { id: 6, name: 'Frank Brown', profilePicture: '/images/frank.jpg' },
  { id: 7, name: 'Grace Lee', profilePicture: '/images/grace.jpg' }
];

function TournamentPage() {
  return (
    <div>
      <h1>Tournament Bracket</h1>
      <SingleEliminationBracket 
        participants={participants}
        className="my-8"
      />
    </div>
  );
}
```

### Dynamic Participants

```tsx
function DynamicTournament() {
  const [participants, setParticipants] = useState([]);
  
  useEffect(() => {
    // Fetch from API
    fetch('/api/tournament/123/participants')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(p => ({
          id: p.user_id,
          name: p.display_name,
          profilePicture: p.profile_picture
        }));
        setParticipants(formatted);
      });
  }, []);
  
  return (
    <SingleEliminationBracket participants={participants} />
  );
}
```

## Props

### `participants` (required)
- **Type**: `Participant[]`
- **Description**: Array of tournament participants
- **Format**:
  ```typescript
  interface Participant {
    id: number;
    name: string;
    profilePicture?: string;
  }
  ```

### `className` (optional)
- **Type**: `string`
- **Description**: Additional CSS classes for styling
- **Default**: `""`

## Examples

### 7 Participants (1 BYE)
- **Bracket Size**: 8 (next power of 2)
- **BYEs**: 1 participant gets automatic advancement
- **Rounds**: 3 (Round 1, Semifinal, Final)

### 8 Participants (No BYEs)
- **Bracket Size**: 8 (perfect power of 2)
- **BYEs**: 0 (all participants play in Round 1)
- **Rounds**: 3 (Quarterfinal, Semifinal, Final)

### 5 Participants (3 BYEs)
- **Bracket Size**: 8 (next power of 2)
- **BYEs**: 3 participants get automatic advancement
- **Rounds**: 3 (Round 1, Semifinal, Final)

## Technical Implementation

### Bracket Size Calculation
```typescript
const bracketSize = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
const numberOfByes = bracketSize - numParticipants;
const totalRounds = Math.ceil(Math.log2(bracketSize));
```

### BYE Logic
- **Round 1**: BYEs assigned to matches with missing participants
- **Visual**: Shows "BYE" with winner clearly indicated
- **Advancement**: Winner automatically set for BYE matches
- **Later Rounds**: No false BYEs, only real participants advance

### Randomization
```typescript
// Fisher-Yates shuffle algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
```

### Round Generation
1. **Round 1**: All participants placed, BYEs assigned
2. **Subsequent Rounds**: Empty matches waiting for results
3. **Spacing**: Exponential spacing between matches
4. **Naming**: Proper round names (Quarterfinal, Semifinal, Final)

## Demo

Visit `/bracket-demo` to see the component in action with different participant counts:

- Test with 2-16 participants
- See BYE handling in action
- Observe bracket structure changes
- View responsive design

## Integration with Tournament System

The component integrates seamlessly with the existing tournament system:

1. **Backend API**: Use existing participant endpoints
2. **Database**: Compatible with tournament_participants table
3. **Frontend**: Drop-in replacement for existing bracket components
4. **Styling**: Matches existing design system

## Requirements Met

- ✅ Supports any number of participants dynamically
- ✅ Handles BYEs in Round 1 using `bracketSize = 2^ceil(log2(N))`
- ✅ Calculates `numberOfByes = bracketSize - N`
- ✅ Creates matches with participant vs. null for BYEs
- ✅ Visually displays who advanced in BYE matches
- ✅ Correctly advances participants from BYE matches
- ✅ Avoids false BYE matches in future rounds
- ✅ Ensures only actual participants advance
- ✅ Uses clean internal structure for rounds
- ✅ Shuffles participants randomly before seeding
- ✅ Renders bracket visually in columns (rounds)
- ✅ Each row displays a match (player1 vs player2)
- ✅ Shows "BYE" with clear advancement indication
- ✅ Clean, readable, well-commented code
- ✅ Explains BYE assignment and advancement
- ✅ Explains round generation logic
- ✅ Explains why false BYEs are avoided
- ✅ No external libraries for bracket generation

## Browser Support

- Modern browsers with ES6+ support
- React 18+
- TypeScript support
- Responsive design (mobile-friendly)

## License

MIT License - feel free to use in any project.
