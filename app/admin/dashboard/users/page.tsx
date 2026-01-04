import UsersTable from "@/components/admin/dashboard/users/table";
import { getAllUsers } from "@/lib/database/actions/admin/user/user.actions";
import React from "react";

const AllUsersPage = async () => {
  let data = [];
  
  try {
    const result = await getAllUsers();
    data = result || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    data = [];
  }

  return (
    <div className="container">
      <UsersTable rows={data} />
    </div>
  );
};

export default AllUsersPage;
