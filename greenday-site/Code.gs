/* IGEN GREENDAY 2026 – backend. Paste in Extensions > Apps Script of your Google Sheet. */
const ADMIN_PASSCODE = 'change-me';      // CHANGE THIS: organisers use it to approve actions
const PTS = {A: 10, B: 15, C: 20};
const H = {
  orgs: ['name','type','contact','email','phone','city','status','createdAt'],
  members: ['id','createdAt','name','orgId','kind'],
  actions: ['id','createdAt','userId','userName','orgId','orgName','cat','activity','el','title','desc','points','status','link','verifiedAt']
};

function sh(n) {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(n);
  if (!s) {
    s = ss.insertSheet(n);
    s.getRange('A:Z').setNumberFormat('@');   // keep dates and ids as plain text
    s.appendRow(H[n]);
    if (n === 'orgs') s.appendRow(['Sample Organisation - replace me']);
  }
  return s;
}
function rows(n) {
  const v = sh(n).getDataRange().getValues(), h = v.shift();
  return v.map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
const clip = v => String(v == null ? '' : v).slice(0, 2000);

const slug = n => String(n).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

function doGet() {
  return out({
    orgs: rows('orgs').filter(o => o.name && (o.status === '' || o.status === 'approved')).map(o => ({id: slug(o.name), name: String(o.name).trim(), type: o.type})),   // add organisations as rows in the orgs tab
    members: rows('members').map(m => ({id: m.id, name: m.name, orgId: m.orgId, kind: m.kind})),
    actions: rows('actions').map(a => Object.assign({}, a, {points: Number(a.points)}))
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const q = JSON.parse(e.postData.contents), d = q.data || {};
    const now = new Date().toISOString();
    if (q.op === 'check') {
      if (q.pass !== ADMIN_PASSCODE) throw new Error('Wrong passcode');
      return out({ok: true});
    }
    if (q.op === 'org') {
      const name = clip(d.name).trim();
      if (!name) throw new Error('Invalid organisation name');
      if (['Higher Education Institution', 'Industry', 'NGO'].indexOf(d.type) < 0) throw new Error('Invalid organisation type');
      if (rows('orgs').some(o => slug(o.name) === slug(name))) throw new Error('Already registered: this organisation name exists');
      const rec = Object.assign({}, d, {name: name, status: 'pending', createdAt: now});
      sh('orgs').appendRow(H.orgs.map(k => clip(rec[k])));
      return out({ok: true});
    }
    if (q.op === 'pending') {
      if (q.pass !== ADMIN_PASSCODE) throw new Error('Wrong passcode');
      return out({ok: true, list: rows('orgs').filter(o => o.name && o.status === 'pending').map(o => Object.assign({}, o, {id: slug(o.name)}))});
    }
    if (q.op === 'orgstatus') {
      if (q.pass !== ADMIN_PASSCODE) throw new Error('Wrong passcode');
      if (q.status !== 'approved' && q.status !== 'rejected') throw new Error('Bad status');
      const s = sh('orgs'), v = s.getDataRange().getValues();
      const i = v.findIndex((r, n) => n > 0 && slug(r[0]) === q.id);
      if (i < 0) throw new Error('Not found');
      s.getRange(i + 1, H.orgs.indexOf('status') + 1).setValue(q.status);
      return out({ok: true});
    }
    if (q.op === 'add' && q.col === 'actions') {
      const rec = Object.assign({}, d, {id: 'r' + Date.now() + Math.random().toString(36).slice(2, 6), createdAt: now});
      {
        rec.points = PTS[d.cat] || 10;
        rec.status = 'pending';
        rec.verifiedAt = '';
        if (!/^https:\/\/([\w-]+\.)?linkedin\.com\//i.test(String(d.link || ''))) throw new Error('Invalid LinkedIn link');
      }
      sh(q.col).appendRow(H[q.col].map(k => clip(rec[k])));
      return out({ok: true, id: rec.id});
    }
    if (q.op === 'member') {
      const s = sh('members'), v = s.getDataRange().getValues();
      const row = H.members.map(k => clip(k === 'createdAt' ? now : d[k]));
      const i = v.findIndex((r, n) => n > 0 && r[0] === d.id);
      if (i < 0) s.appendRow(row); else s.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return out({ok: true});
    }
    if (q.op === 'verify') {
      if (q.pass !== ADMIN_PASSCODE) throw new Error('Wrong passcode');
      if (q.status !== 'verified' && q.status !== 'rejected') throw new Error('Bad status');
      const s = sh('actions'), v = s.getDataRange().getValues();
      const i = v.findIndex((r, n) => n > 0 && r[0] === q.id);
      if (i < 0) throw new Error('Not found');
      s.getRange(i + 1, H.actions.indexOf('status') + 1).setValue(q.status);
      s.getRange(i + 1, H.actions.indexOf('verifiedAt') + 1).setValue(now);
      return out({ok: true});
    }
    throw new Error('Unknown request');
  } catch (err) {
    return out({ok: false, error: String(err.message || err)});
  } finally {
    lock.releaseLock();
  }
}
