export default function Card({ children, className = '', title, action }) {
  return (
    <div className={`bg-dark-card border border-dark-border rounded-xl ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <h3 className="font-semibold text-white">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
