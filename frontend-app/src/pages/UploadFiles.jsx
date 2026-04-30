import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { bulkCreateUsers } from '../api/users';

const TEMPLATE_ROWS = [
  ['1','C001','Alice Kumar','Candidate','Pass@123','Lab-A','ADD'],
  ['2','C002','Bob Singh','Candidate','Pass@123','Lab-A','ADD'],
];

export default function BulkUserUpload() {
  const { user } = useAuth();
  const [file,     setFile]    = useState(null);
  const [loading,  setLoading] = useState(false);
  const [result,   setResult]  = useState(null);
  const [error,    setError]   = useState('');
  const inputRef = useRef();

  const allowedRoles = user?.role === 'SuperAdmin' ? ['Admin','Candidate'] : ['Candidate'];

  const handleUpload = async () => {
    if (!file) { setError('Please select an Excel file.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await bulkCreateUsers(file);
      setResult(data);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const downloadTemplate = () => {
    const rows = [['Sl No','UserID','Name','Role','Password','Lab','Action'], ...TEMPLATE_ROWS];
    const csv  = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='user_upload_template.csv'; a.click();
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Bulk User Upload</h2>
        <p style={s.sub}>
          {user?.role==='SuperAdmin' ? 'Create Admin or Candidate accounts' : 'Create Candidate accounts'} via Excel file.
        </p>
      </div>

      {/* Instructions */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>📋 File Format</h3>
        <p style={s.hint}>Excel columns (row 1 = headers):</p>
        <div style={s.tableWrap}>
          <table style={s.tbl}>
            <thead><tr>{['Sl No','UserID','Name','Role','Password','Lab','Action'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {TEMPLATE_ROWS.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} style={s.td}>{c}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
        <p style={s.hint}>
          <strong>Roles allowed:</strong> {allowedRoles.join(', ')} &nbsp;·&nbsp;
          <strong>Actions:</strong> ADD, MOD, DEL, INACT, ACT &nbsp;·&nbsp;
          <strong>Password:</strong> 8-20 chars, 1 upper, 1 number, 1 special (@#$%&*)
        </p>
        <button onClick={downloadTemplate} style={s.dlBtn}>⬇ Download Template CSV</button>
      </div>

      {/* Upload */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>📤 Upload File</h3>
        <div
          style={{...s.dropZone, borderColor: file ? '#16a34a':'#d1d5db'}}
          onClick={()=>inputRef.current?.click()}
          onDragOver={e=>{e.preventDefault();}}
          onDrop={e=>{e.preventDefault(); const f=e.dataTransfer.files[0]; if(f)setFile(f);}}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
            onChange={e=>{setFile(e.target.files[0]); setResult(null); setError('');}} />
          {file ? (
            <><p style={{fontSize:28,margin:0}}>📊</p>
              <p style={{margin:'6px 0 2px',fontWeight:600,color:'#1e293b'}}>{file.name}</p>
              <p style={{margin:0,fontSize:12,color:'#64748b'}}>{(file.size/1024).toFixed(1)} KB</p></>
          ) : (
            <><p style={{fontSize:34,margin:0}}>⬆</p>
              <p style={{margin:'8px 0 4px',fontWeight:600,color:'#374151'}}>Drag & drop or click to browse</p>
              <p style={{margin:0,fontSize:12,color:'#94a3b8'}}>Accepted: .xlsx, .xls, .csv</p></>
          )}
        </div>
        {error && <p style={s.errText}>{error}</p>}
        <button onClick={handleUpload} disabled={loading||!file} style={{...s.uploadBtn,opacity:(!file||loading)?0.5:1}}>
          {loading ? 'Processing…' : 'Upload & Process'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>✅ Result</h3>
          <div style={s.statRow}>
            <div style={{...s.stat,background:'#f0fdf4',color:'#166534'}}><span style={s.statNum}>{result.success}</span><span>Success</span></div>
            <div style={{...s.stat,background:'#fef2f2',color:'#991b1b'}}><span style={s.statNum}>{result.fail}</span><span>Failed</span></div>
            <div style={{...s.stat,background:'#f8fafc',color:'#334155'}}><span style={s.statNum}>{result.total}</span><span>Total</span></div>
          </div>
          {result.fail > 0 && (
            <div style={s.tableWrap}>
              <p style={{...s.hint,marginBottom:8}}>Failed rows:</p>
              <table style={s.tbl}>
                <thead><tr>{['UserID','Action','Reason'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {result.results.filter(r=>r.status==='FAIL').map((r,i)=>(
                    <tr key={i}>
                      <td style={s.td}>{r.user_id}</td>
                      <td style={s.td}>{r.action}</td>
                      <td style={{...s.td,color:'#dc2626'}}>{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  page:      {padding:'24px 20px',maxWidth:860,margin:'0 auto'},
  header:    {marginBottom:20},
  title:     {margin:'0 0 4px',fontSize:22,fontWeight:700,color:'#1e293b'},
  sub:       {margin:0,fontSize:13,color:'#64748b'},
  card:      {background:'#fff',borderRadius:10,padding:'20px 24px',marginBottom:16,boxShadow:'0 1px 8px rgba(0,0,0,.07)'},
  cardTitle: {margin:'0 0 14px',fontSize:16,fontWeight:700,color:'#1e293b'},
  hint:      {fontSize:13,color:'#64748b',marginBottom:10},
  tableWrap: {overflowX:'auto',marginBottom:12},
  tbl:       {width:'100%',borderCollapse:'collapse',fontSize:13},
  th:        {padding:'8px 12px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:11,textTransform:'uppercase',whiteSpace:'nowrap'},
  td:        {padding:'8px 12px',borderBottom:'1px solid #f1f5f9',color:'#1e293b'},
  dropZone:  {border:'2px dashed',borderRadius:10,padding:'28px 20px',textAlign:'center',cursor:'pointer',marginBottom:14,background:'#fafafa',transition:'border-color .15s'},
  errText:   {color:'#dc2626',fontSize:13,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:6,padding:'8px 12px',marginBottom:12},
  dlBtn:     {padding:'8px 16px',background:'#f8fafc',border:'1px solid #d1d5db',borderRadius:7,fontSize:13,fontWeight:600,cursor:'pointer',color:'#374151'},
  uploadBtn: {width:'100%',padding:'11px',background:'#1d4ed8',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer',marginTop:4},
  statRow:   {display:'flex',gap:12,marginBottom:16},
  stat:      {flex:1,borderRadius:8,padding:'12px',textAlign:'center',display:'flex',flexDirection:'column',gap:4},
  statNum:   {fontSize:28,fontWeight:700},
};  