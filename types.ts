
export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string; // Optional extended label
  fill?: string; // Optional specific color override
  [key: string]: any;
}

export enum SectionType {
  TEXT = 'TEXT',
  BAR_CHART = 'BAR_CHART',
  PIE_CHART = 'PIE_CHART',
  LINE_CHART = 'LINE_CHART',
  TABLE = 'TABLE'
}

export interface ReportSection {
  id: string;
  title: string;
  type: SectionType;
  content: string; // Markdown supported
  chartData?: ChartDataPoint[]; // For chart sections
  chartConfig?: {
    xLabel?: string;
    yLabel?: string;
    title?: string;
  };
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Report {
  id: string;        // Unique ID for history
  createdAt: number; // Timestamp for sorting
  title: string;
  date: string;
  executiveSummary: string;
  keyInsights: Array<{
    icon: 'trend-up' | 'trend-down' | 'alert' | 'info';
    text: string;
    value?: string;
    color?: string; // Hex code suggestion
  }>;
  sections: ReportSection[];
  sources?: GroundingSource[];
}

export interface SearchState {
  isSearching: boolean;
  stage: 'idle' | 'researching' | 'analyzing' | 'formatting' | 'complete';
  query: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
