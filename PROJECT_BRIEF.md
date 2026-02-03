# Project Zomboid Chat Log Analyzer - Project Brief

## Project Overview

A web-based tool for parsing, filtering, and analyzing Project Zomboid server chat logs. This replaces a manual Google Sheets workflow with an automated, user-friendly React application.

### Problem Statement
Currently using a complex Google Sheet with formulas to parse individual log files by copy/paste. Server logs are fragmented across multiple files (restart creates new file, date-based subfolders), making manual analysis tedious and error-prone.

### Solution
A React web application that:
- Accepts file uploads (drag & drop or browse)
- Parses Project Zomboid chat log format automatically
- Aggregates data across multiple files
- Provides powerful filtering capabilities
- Exports filtered results (CSV and Discord-formatted)

---

## V1 Scope (MVP)

### In Scope
1. **File Upload & Parsing**
   - Manual file upload (drag & drop + browse)
   - Support multiple file uploads to aggregate data
   - Parse all log entries into structured data
   - Display parse success/error feedback

2. **Data Display**
   - Sortable table view with all parsed fields
   - Timezone-aware timestamp display
   - Responsive design
   - Column visibility toggles

3. **Filtering**
   - User multi-select filter
   - Date/time range filter
   - Coordinate radius filter (center point + distance)
   - Language multi-select filter
   - Message type multi-select filter
   - Text search in message content
   - "Reset all filters" button

4. **Export**
   - Export filtered results to CSV
   - Copy to Discord format (individual or bulk)
   - Copy to clipboard functionality

5. **UI/UX**
   - Clean, modern interface
   - Loading states
   - Empty states
   - Error handling
   - Mobile responsive
   - Dark mode support

### Out of Scope (Future V2+)
- ❌ FTP auto-fetch from servers
- ❌ Interactive map visualization with radius tool
- ❌ Data persistence (LocalStorage/IndexedDB)
- ❌ User accounts or authentication
- ❌ Sharing filtered views via URL

---

## Technical Architecture

### Tech Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Date Handling**: date-fns-tz (timezone support)
- **State Management**: React hooks (useState, useMemo)

### Backend Approach
**NONE - Pure Client-Side Application**

Reasons:
- Zero cost (no database/hosting fees)
- Maximum privacy (files never uploaded)
- Simple deployment (static hosting)
- Fast performance (in-memory processing)
- No backend complexity

Data flow:
1. User uploads files → Browser FileReader API
2. Parse in browser → JavaScript string parsing
3. Store in React state → `useState`
4. Filter/sort → `useMemo` for performance
5. Export → Browser download API / Clipboard API

### Deployment
- Vercel (recommended) or Netlify
- GitHub Pages (alternative)
- Static file hosting

---

## Data Structures

### Raw Log Format
```
[DD-MM-YY HH:mm:ss.SSS] Username (Nickname) @ lat,lng,floor: [lang] /msgType message
```

**Example:**
```
[10-11-25 21:29:30.123] Rota Lyashko (Rota) @ 5776,11056,0: [en] /say -, no, - no, - I believe you.
```

### Parsed Data Interface
```typescript
interface ChatLog {
  timestamp: Date;           // Parsed from [DD-MM-YY HH:mm:ss.SSS]
  user: string;              // Username from log
  nickname?: string;         // Character name (in parentheses)
  message: string;           // The actual chat message
  latitude?: number;         // X coordinate
  longitude?: number;        // Y coordinate  
  floor?: number;            // Z level (0, 1, 2, etc.)
  lang?: string;             // Language code (en, es, de, fr, ga, it)
  msgType?: string;          // Command type (/say, /ooc, /me, /yell, /whisper, etc.)
}
```

### Message Types
Common message types found in logs:
- `/say` - Normal speech
- `/ooc` - Out of character
- `/me` - Emote/action
- `/yell` - Shouting
- `/whisper` - Quiet speech
- `/low` - Low volume
- `/coord` - Coordinate sharing
- `/admin` - Admin commands
- `/env` - Environment commands

### Languages
Common language codes:
- `en` - English
- `es` - Spanish
- `de` - German
- `fr` - French
- `ga` - Gaelic/Irish
- `it` - Italian

---

## Parsing Logic (from V1 - works well!)

### Regex Pattern
```typescript
const primaryFormat = /\[([^\]]+)\]\s+([^(]+)\s*\(([^)]+)\)\s*@\s*([^,]+),([^,]+),([^:]+):\s*\[(\w+)\]\s*(.+)/;
```

### Timestamp Parsing
Timestamps are in format: `DD-MM-YY HH:mm:ss.SSS` (UTC)

Example parsing:
```typescript
// Input: "10-11-25 21:29:30.686"
const [day, month, year] = datePart.split('-');
const fullYear = `20${year}`; // "25" -> "2025"
const isoString = `${fullYear}-${month}-${day}T${timePart}Z`;
const parsedDate = new Date(isoString); // UTC date object
```

### Message Type Extraction
```typescript
let msgType: string | undefined;
let message = fullMessage.trim();

if (message.startsWith('/')) {
  const commandMatch = message.match(/^(\/\w+)\s*/);
  if (commandMatch) {
    msgType = commandMatch[1]; // e.g., "/say"
    message = message.substring(commandMatch[0].length).trim();
  }
}
```

---

## Filtering Requirements

### User Filter
- Multi-select dropdown
- Show all unique usernames from parsed logs
- Filter: Show only logs from selected users
- Default: All users shown

### Date/Time Range Filter
- Start datetime input (datetime-local)
- End datetime input (datetime-local)
- Filter: timestamp >= start AND timestamp <= end
- Display in user's selected timezone

### Coordinate Radius Filter
- Center latitude input (number)
- Center longitude input (number)
- Radius distance input (number, in tiles/units)
- Floor input (optional - blank = any floor)
- Filter logic:
  ```typescript
  const distance = Math.sqrt(
    Math.pow(log.latitude - centerLat, 2) + 
    Math.pow(log.longitude - centerLng, 2)
  );
  return distance <= radius && (floor === '' || log.floor === floor);
  ```

### Language Filter
- Multi-select dropdown
- Show all unique languages from logs
- Filter: Show only logs in selected languages
- Default: All languages shown

### Message Type Filter
- Multi-select dropdown
- Show all unique message types from logs
- Filter: Show only logs with selected message types
- Default: All message types shown

### Text Search
- Free text input
- Case-insensitive search
- Filter: message.toLowerCase().includes(searchTerm.toLowerCase())

---

## Discord Export Format

### Individual Message Format
```markdown
> -# Username <t:UNIX_TIMESTAMP:f> - `lat,lng,floor`
> *[lang] message content*
```

### Example Output
```markdown
> -# Maeve Greene <t:1760141192:f> - `3954,11673,2`
> *[en] /me would jump up again, putting her arms up. "Fellas... please..."*
```

### Implementation Notes
- Convert JavaScript Date to Unix timestamp: `Math.floor(date.getTime() / 1000)`
- Discord timestamp `<t:UNIX:f>` auto-converts to viewer's local timezone
- Use `-#` for small quote text
- Italicize message with `*...*`
- Include language tag and coordinates in code blocks

---

## CSV Export Format

### Columns (in order)
1. Timestamp (ISO 8601 format or formatted string)
2. Username
3. Nickname
4. Latitude
5. Longitude
6. Floor
7. Language
8. Message Type
9. Message

### Implementation
- Include headers row
- Escape fields containing commas with quotes
- Handle newlines in message content
- Use selected timezone for timestamp formatting

---

## UI/UX Guidelines

### Layout Structure
```
┌─────────────────────────────────────┐
│  Header                             │
│  - App title                        │
│  - Timezone selector                │
├─────────────────────────────────────┤
│  File Upload Area                   │
│  (if no data loaded)                │
├─────────────────────────────────────┤
│  Filters Panel (collapsible)        │
│  - Search                           │
│  - User filter                      │
│  - Date range                       │
│  - Location filter                  │
│  - Language/Type filters            │
│  - Reset button                     │
├─────────────────────────────────────┤
│  Action Bar                         │
│  - Result count                     │
│  - Export CSV button                │
│  - Copy to Discord button           │
│  - Column visibility toggle         │
├─────────────────────────────────────┤
│  Data Table                         │
│  - Sortable columns                 │
│  - Responsive                       │
│  - Pagination (if needed)           │
└─────────────────────────────────────┘
```

### Design Principles
- **Clean & Modern**: Avoid cluttered V1 design
- **Progressive Disclosure**: Hide complexity until needed
- **Responsive**: Mobile-friendly from the start
- **Fast**: Optimize for large datasets (100k+ entries)
- **Intuitive**: Clear labels, helpful tooltips
- **Accessible**: Keyboard navigation, screen reader support

### Color Scheme
Use existing Tailwind config from V1:
- Primary: `hsl(217 91% 60%)` (blue)
- Accent: `hsl(188 94% 45%)` (cyan)
- Background: `hsl(210 40% 98%)` (light) / `hsl(222 47% 11%)` (dark)
- Borders: Subtle, low contrast

---

## Performance Considerations

### File Size Limits
- Support files with 100,000+ lines
- Target parse time: < 2 seconds for 100k entries
- Use streaming for very large files if needed

### Filtering Performance
- Use `useMemo` to memoize filtered results
- Debounce text search (300ms delay)
- Virtual scrolling if table has 10,000+ visible rows

### Memory Management
- Be cautious with very large datasets
- Consider pagination or virtual scrolling
- Allow users to clear/reset data

---

## Error Handling

### File Upload Errors
- Non-.txt file selected
- Empty file
- File read failure
- Display user-friendly error message

### Parsing Errors
- Malformed log lines
- Invalid date formats
- Missing required fields
- Log parsing errors but continue with valid entries
- Show warning with count of skipped entries

### Filter Errors
- Invalid number inputs (coordinates, radius)
- Invalid date range (end before start)
- Provide inline validation feedback

---

## Success Metrics

### V1 Launch Criteria
- ✅ Can upload and parse 100,000+ line file in < 3 seconds
- ✅ All filters work correctly
- ✅ Export to CSV works
- ✅ Discord copy format is correct
- ✅ UI is responsive on mobile/tablet/desktop
- ✅ No console errors
- ✅ Works in Chrome, Firefox, Safari

### User Experience Goals
- Faster than manual Google Sheets workflow
- Easier to use (no formula knowledge needed)
- More powerful filtering capabilities
- Can handle multiple files at once
- Shareable results (CSV/Discord)

---

## Future Enhancements (V2+)

### Phase 2: Advanced Features
- FTP connection to auto-fetch logs from servers
- Save/load filter presets
- Data persistence (LocalStorage or IndexedDB)
- Bookmarking specific log entries
- Export to other formats (JSON, Markdown)

### Phase 3: Visualization
- Interactive map view with coordinate plotting
- Radius tool on map for visual filtering
- Heatmap of activity by location
- Timeline view of chat activity

### Phase 4: Collaboration
- Share filtered views via URL
- Collaborative notes on log entries
- Multi-server support
- API for external integrations

---

## Development Notes

### From V1 Analysis
**What worked well:**
- Parsing regex is solid
- shadcn/ui components look good
- TypeScript typing for ChatLog interface
- Timezone handling with date-fns-tz

**What to improve:**
- Remove Supabase dependency entirely
- Simplify UI (V1 was cluttered)
- Better mobile experience
- More intuitive filter controls
- Faster initial load

### Testing Checklist
- [ ] Upload single file
- [ ] Upload multiple files (aggregation)
- [ ] Parse 100k+ line file
- [ ] All filters work independently
- [ ] All filters work in combination
- [ ] Sort by each column
- [ ] Export CSV with filters applied
- [ ] Copy to Discord format
- [ ] Timezone changes update display
- [ ] Reset filters clears all
- [ ] Mobile responsive layout
- [ ] Dark mode works correctly

---

## Getting Started (for Claude or developer)

1. **Initialize project**
   ```bash
   npm create vite@latest pz-log-analyzer -- --template react-ts
   cd pz-log-analyzer
   npm install
   ```

2. **Add dependencies**
   ```bash
   npm install tailwindcss @tailwindcss/forms
   npm install -D @types/node
   npm install date-fns date-fns-tz
   npm install lucide-react
   npx shadcn-ui@latest init
   ```

3. **Add shadcn/ui components**
   ```bash
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add table
   npx shadcn-ui@latest add select
   npx shadcn-ui@latest add popover
   npx shadcn-ui@latest add checkbox
   npx shadcn-ui@latest add badge
   npx shadcn-ui@latest add collapsible
   ```

4. **Create core files**
   - `src/types/ChatLog.ts` - TypeScript interfaces
   - `src/utils/parseLogFile.ts` - Parsing logic
   - `src/utils/filterLogs.ts` - Filter functions
   - `src/utils/exportUtils.ts` - CSV and Discord export
   - `src/components/FileUpload.tsx`
   - `src/components/FilterPanel.tsx`
   - `src/components/LogTable.tsx`
   - `src/components/ExportButtons.tsx`

5. **Implement features** in order:
   - File upload + parsing
   - Table display
   - Basic filtering
   - Export functionality
   - UI polish

---

## Contact & Resources

- **Original Google Sheet workflow**: Manual copy/paste with complex formulas
- **Server examples**: Indifferent Broccoli (FTP access)
- **Log format reference**: Project Zomboid server logs (text files)

---

## Version History

- **V0 (Current)**: Manual Google Sheets workflow
- **V1 (This Build)**: React app with client-side parsing and filtering
- **V2 (Future)**: FTP integration + map visualization
- **V3 (Future)**: Collaboration features

---

*Last Updated: January 31, 2026*
*Project Status: Planning Phase → Ready for Development*
