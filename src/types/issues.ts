// Customer Issues Management
export interface CustomerIssue {
  id: string;
  customer_id: string;
  order_id?: string; // Optional link to specific order
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  issue_type:
    | 'Complaint'
    | 'Refund Request'
    | 'Replacement Request'
    | 'Technical Support'
    | 'General Inquiry';
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  comment: string;
  created_by: string;
  created_at: string;
  is_internal: boolean; // Internal notes vs customer communication
}

export interface IssueCreateData {
  customer_id: string;
  order_id?: string;
  title: string;
  description: string;
  priority: CustomerIssue['priority'];
  issue_type: CustomerIssue['issue_type'];
}

export interface IssueUpdateData {
  id: string;
  title?: string;
  description?: string;
  priority?: CustomerIssue['priority'];
  status?: CustomerIssue['status'];
  assigned_to?: string;
}

// Issue Analytics
export interface IssueAnalytics {
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  avg_resolution_time: number; // in hours
  issues_by_type: Array<{
    type: CustomerIssue['issue_type'];
    count: number;
  }>;
  issues_by_priority: Array<{
    priority: CustomerIssue['priority'];
    count: number;
  }>;
}
