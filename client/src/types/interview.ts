export interface Interview {
  id: string;
  title: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  candidate: {
    name: string;
    email: string;
  };
  interviewer: {
    name: string;
    email: string;
  };
  observers?: Array<{
    name: string;
    email: string;
  }>;
} 