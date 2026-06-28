import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, LoadingState } from "../../components";
import { getAdminReports, updateReportStatus } from "../../services/admin";
import "./admin.css";

const STATUSES = ["open", "reviewed", "dismissed", "action_taken"];

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      setReports(await getAdminReports());
    } catch {
      setError("Could not load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatus = async (reportId, status) => {
    try {
      await updateReportStatus(reportId, status);
      await load();
    } catch {
      setError("Update failed.");
    }
  };

  if (loading) return <LoadingState label="Loading reports…" />;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Reports</h1>
        <Link to="/admin/live-rooms" className="admin-page__link">
          Live rooms
        </Link>
      </div>

      {error && <p className="rooms-page__error">{error}</p>}

      {reports.length === 0 ? (
        <p className="admin-page__empty">No reports yet.</p>
      ) : (
        <div className="admin-page__list">
          {reports.map((report) => (
            <div key={report.id} className="admin-card">
              <strong>{report.reason}</strong>
              <p className="admin-card__meta">
                {report.room_title ? `Room: ${report.room_title}` : "No room"}
                {report.reported_user_email
                  ? ` · User: ${report.reported_user_email}`
                  : ""}
              </p>
              {report.details && <p className="admin-card__body">{report.details}</p>}
              <p className="admin-card__meta">Status: {report.status}</p>
              <div className="admin-card__actions">
                {STATUSES.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={report.status === status ? "primary" : "secondary"}
                    onClick={() => handleStatus(report.id, status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
