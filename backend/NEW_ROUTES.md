# New API Routes Documentation

## Search History Routes

### GET /search-history
Get user's drug search history (past searches)

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "user_id": "uuid",
  "total_searches": 15,
  "history": [
    {
      "drug_name": "WARFARIN",
      "risk_label": "Adjust Dosage",
      "searched_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Usage:**
```bash
curl -X GET "http://localhost:8000/search-history" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Advanced Analysis Routes

### POST /advanced-analysis
Generate comprehensive genetic analysis (one-time, saved to database)

**Authentication:** Required (Bearer token)

**Description:** 
- Analyzes ALL user's genetic data
- Identifies harmful medications to avoid
- Lists safe medications
- Provides lifestyle recommendations
- Generates comprehensive report
- Saves to database (only generated once per user)

**Response:**
```json
{
  "message": "Advanced analysis generated successfully",
  "analysis": {
    "harmful_drugs": [
      {
        "drug": "CODEINE",
        "reason": "Patient is ultrarapid metabolizer, risk of toxicity",
        "gene": "CYP2D6",
        "phenotype": "UM",
        "severity": "Critical",
        "alternatives": "Use morphine or hydromorphone instead"
      }
    ],
    "safe_drugs": [
      {
        "drug": "ASPIRIN",
        "reason": "No genetic contraindications",
        "gene": "N/A"
      }
    ],
    "recommendations": {
      "lifestyle": "Avoid alcohol with certain medications",
      "monitoring": "Regular liver function tests recommended",
      "doctor_discussion": "Inform doctor about CYP2D6 ultrarapid metabolizer status"
    },
    "full_report": "Comprehensive 3-4 paragraph analysis..."
  }
}
```

**Usage:**
```bash
curl -X POST "http://localhost:8000/advanced-analysis" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### GET /advanced-analysis
Retrieve saved advanced analysis

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "user_id": "uuid",
  "analysis": {
    "harmful_drugs": [...],
    "safe_drugs": [...],
    "recommendations": {...},
    "full_report": "...",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Usage:**
```bash
curl -X GET "http://localhost:8000/advanced-analysis" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Updated Routes

### POST /query-drug
Now automatically saves searches to history

**Changes:**
- Automatically logs each drug search to search_history table
- No breaking changes to existing functionality

---

## Database Schema

### search_history table
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- drug_name: VARCHAR(255)
- risk_label: VARCHAR(50)
- searched_at: TIMESTAMP
```

### advanced_analyses table
```sql
- id: UUID (primary key)
- user_id: UUID (unique, foreign key to users)
- harmful_drugs: JSONB
- safe_drugs: JSONB
- recommendations: JSONB
- full_report: JSONB
- created_at: TIMESTAMP
```

---

## Setup Instructions

1. Run the migration:
```bash
psql $DATABASE_URL -f migrations.sql
```

2. Restart the backend server:
```bash
uvicorn main:app --reload
```

3. Test the new endpoints using the examples above

---

## Frontend Integration

### Dashboard Component
```javascript
// Generate advanced analysis (one-time)
const generateAnalysis = async () => {
  const response = await fetch('/advanced-analysis', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  // Display harmful drugs, safe drugs, recommendations
};

// Get search history
const getHistory = async () => {
  const response = await fetch('/search-history', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  // Display past searches
};
```
