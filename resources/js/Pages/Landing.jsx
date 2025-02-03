import PublicLayout from "@/Layouts/PublicLayout";

export default function Landing() {
  
    return (
        <PublicLayout>
            <div className="text-center">
                <h1 className="text-3xl font-semibold text-gray-800">Welcome to RoomEase</h1>
                <p className="text-gray-600 mt-2">The best room booking app for your needs</p>
                
            </div>
        </PublicLayout>
    );
}