import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let status = 500;
  let title = "Something went wrong";
  let message = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (status === 404) {
      title = "Page not found";
      message = "The page you're looking for doesn't exist.";
    } else if (status === 403) {
      title = "Access denied";
      message = "You don't have permission to view this page.";
    } else {
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  const stack = import.meta.env.DEV && error instanceof Error ? error.stack : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-6xl font-bold text-indigo-600 mb-2">{status}</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 mb-8">{message}</p>

        {stack && (
          <pre className="text-left text-xs bg-gray-100 border border-gray-200 rounded p-4 mb-6 overflow-auto max-h-48 text-red-600">
            {stack}
          </pre>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">
            Go back
          </button>
          <button
            onClick={() => navigate("/library", { replace: true })}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            Go to Library
          </button>
        </div>
      </div>
    </div>
  );
}
