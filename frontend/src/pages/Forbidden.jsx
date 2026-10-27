import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-red-600">403</h1>
      <p className="text-gray-500 mt-2">Access forbidden</p>
      <Link to="/dashboard" className="mt-4 text-primary-600 hover:underline">
        Go to Dashboard
      </Link>
    </div>
  );
}
