import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Legacy /login route → landing with login modal open */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    navigate(
      {
        pathname: "/",
        search: "?login=1",
      },
      {
        replace: true,
        state: location.state || {},
      },
    );
  }, [navigate, location.state]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Opening login…
    </div>
  );
};

export default Login;
