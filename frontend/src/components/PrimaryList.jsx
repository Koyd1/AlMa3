import { useEffect, useState } from "react";

export default function PrimaryList() {
  const [items, setItems] = useState([]);

useEffect(() => {
  const load = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/primary/`, {
        redirect: "follow", // явно говорим fetch обрабатывать редиректы
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("API error:", err);
    }
  };
  load();
}, []);


  return (
    <div>
      <h2>Primary Table</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.id}: {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
