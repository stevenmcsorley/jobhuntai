#!/usr/bin/env python3
import os
import json
import sqlite3
from flask import Flask, render_template_string
from datetime import datetime

app = Flask(__name__)

DB_FILE = "jobhunt.db"

TEMPLATE = """
<!doctype html>
<html lang="en" data-bs-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Job Hunt Dashboard v2</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <style>
    body { padding: 1rem; }
    .card { margin-bottom: 1.5rem; }
    .searchable-table tbody tr:hover { background-color: rgba(0,0,0,0.05); }
    .job-title { font-weight: 500; }
    .company-name { color: #6c757d; }
    .time-ago { cursor: help; }
  </style>
</head>
<body>
  <div class="container">
    <header class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h2"><i class="fas fa-briefcase"></i> Job Hunt Dashboard</h1>
      <div class="text-muted">Last Updated: <span class="time-ago" data-date="{{ last_run }}"></span></div>
    </header>

    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="fas fa-file-alt"></i> {{ jobs_found }}</h5>
            <p class="card-text">Total Jobs Scraped</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center bg-success text-white">
          <div class="card-body">
            <h5 class="card-title"><i class="fas fa-check-circle"></i> {{ applied_jobs|length }}</h5>
            <p class="card-text">Applications Sent</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center bg-warning text-dark">
          <div class="card-body">
            <h5 class="card-title"><i class="fas fa-hourglass-half"></i> {{ followup_jobs|length }}</h5>
            <p class="card-text">Needs Follow‑up</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <input type="text" id="searchInput" class="form-control" placeholder="Search for jobs by title, company, or location…">
    </div>

    <!-- Applied Jobs -->
    <div class="card mb-4">
      <div class="card-header"><h2><i class="fas fa-list-check"></i> Applied Jobs</h2></div>
      <div class="card-body p-0">
        <table class="table table-hover searchable-table mb-0">
          <thead>
            <tr>
              <th>Job Title</th><th>Company</th><th>Location</th>
              <th>Date Applied</th><th>Score</th><th>Key Reasons</th><th>Link</th>
            </tr>
          </thead>
          <tbody>
            {% for job in applied_jobs %}
              <tr>
                <td class="job-title">{{ job.title }}</td>
                <td class="company-name">{{ job.company }}</td>
                <td>{{ job.location }}</td>
                <td><span class="time-ago" data-date="{{ job.applied_at }}"></span></td>
                <td>{{ job.score if job.score is not none else '—' }}</td>
                <td>
                  {% if job.reasons %}
                    <ul class="mb-0 ps-3">
                    {% for r in job.reasons %}
                      <li>{{ r }}</li>
                    {% endfor %}
                    </ul>
                  {% else %}
                    —
                  {% endif %}
                </td>
                <td><a href="{{ job.url }}" class="btn btn-sm btn-outline-primary" target="_blank">View</a></td>
              </tr>
            {% else %}
              <tr><td colspan="7" class="text-center py-3">No applied jobs to display.</td></tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Follow‑up Jobs -->
    <div class="card">
      <div class="card-header"><h2><i class="fas fa-bell"></i> Follow‑up</h2></div>
      <div class="card-body p-0">
        <table class="table table-hover searchable-table mb-0">
          <thead>
            <tr>
              <th>Job Title</th><th>Company</th><th>Location</th>
              <th>Date Added</th><th>Reason</th><th>Score</th><th>Key Reasons</th><th>Link</th>
            </tr>
          </thead>
          <tbody>
            {% for job in followup_jobs %}
              <tr>
                <td class="job-title">{{ job.title }}</td>
                <td class="company-name">{{ job.company }}</td>
                <td>{{ job.location }}</td>
                <td><span class="time-ago" data-date="{{ job.applied_at }}"></span></td>
                <td><span class="badge bg-info">{{ job.status }}</span></td>
                <td>{{ job.score if job.score is not none else '—' }}</td>
                <td>
                  {% if job.reasons %}
                    <ul class="mb-0 ps-3">
                    {% for r in job.reasons %}
                      <li>{{ r }}</li>
                    {% endfor %}
                    </ul>
                  {% else %}
                    —
                  {% endif %}
                </td>
                <td><a href="{{ job.url }}" class="btn btn-sm btn-outline-secondary" target="_blank">View</a></td>
              </tr>
            {% else %}
              <tr><td colspan="8" class="text-center py-3">No jobs marked for follow‑up.</td></tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    // Live Search
    document.getElementById('searchInput').addEventListener('keyup', function(){
      const filter = this.value.toLowerCase();
      document.querySelectorAll('.searchable-table tbody tr').forEach(row => {
        row.style.display = Array.from(row.cells).some(cell =>
          cell.textContent.toLowerCase().includes(filter)
        ) ? '' : 'none';
      });
    });

    // Human‑readable time‑ago
    function timeAgo(dateString){
      if(!dateString) return 'N/A';
      const d=new Date(dateString), now=new Date(), s=Math.round((now-d)/1000);
      if(s<60) return s+'s ago';
      const m=Math.round(s/60); if(m<60) return m+'m ago';
      const h=Math.round(m/60); if(h<24) return h+'h ago';
      const D=Math.round(h/24); if(D<7) return D+'d ago';
      const W=Math.round(D/7); if(W<5) return W+'w ago';
      const M=Math.round(D/30.44); if(M<12) return M+'mo ago';
      return Math.round(D/365.25)+'y ago';
    }
    document.addEventListener('DOMContentLoaded', ()=>{
      document.querySelectorAll('.time-ago').forEach(el=>{
        const d=el.dataset.date;
        el.textContent = timeAgo(d);
        el.title = d ? new Date(d).toLocaleString() : '';
      });
    });
  </script>
</body>
</html>
"""

def query_db(query, args=(), one=False):
    if not os.path.exists(DB_FILE):
        return None
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.close()
    return (rv[0] if rv else None) if one else rv

@app.route("/job-hunt")
def job_hunt():
    jobs_found_row = query_db("SELECT COUNT(id) as count FROM jobs", one=True)
    jobs_found = jobs_found_row['count'] if jobs_found_row else 0

    apps = query_db("""
        SELECT j.title, j.company, j.location, j.url, a.status, a.applied_at, m.score, m.reasons
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        LEFT JOIN matches m ON a.job_id = m.job_id
        ORDER BY a.id DESC
    """)

    applied_jobs = []
    followup_jobs = []

    if apps:
        for app_row in apps:
            reasons = json.loads(app_row['reasons']) if app_row['reasons'] else []
            job_data = {
                "title": app_row['title'],
                "company": app_row['company'],
                "location": app_row['location'],
                "url": app_row['url'],
                "status": app_row['status'],
                "applied_at": app_row['applied_at'],
                "score": app_row['score'],
                "reasons": reasons
            }
            if app_row['status'] == 'applied':
                applied_jobs.append(job_data)
            else:
                followup_jobs.append(job_data)

    last_run_row = query_db("SELECT MAX(scraped_at) as last_run FROM jobs", one=True)
    last_run = last_run_row['last_run'] if last_run_row else ""

    return render_template_string(
        TEMPLATE,
        jobs_found=jobs_found,
        applied_jobs=applied_jobs,
        followup_jobs=followup_jobs,
        last_run=last_run
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
