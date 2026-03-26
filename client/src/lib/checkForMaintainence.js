import { redirect } from "next/navigation";

export function checkForMaintenance(error) {
    if (error?.message?.toLowerCase().includes("under maintenance")) {
        redirect("/maintenance");
    }
}

export function checkForMaintenanceInResponse(response) {
    if (response?.message?.toLowerCase().includes("under maintenance")) {
        redirect("/maintenance");
    }
}