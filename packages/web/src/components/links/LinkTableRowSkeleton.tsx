export default function LinkTableRowSkeleton() {
  return (
    <tr className="group">
      <td className="p-4">
        <div className="skeleton w-[50px] h-[12px]" />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="skeleton w-[70%] h-[14px]" />
          <div className="skeleton w-[12px] h-[12px]" />
        </div>
      </td>
      <td className="p-4">
        <div className="skeleton w-[100px] h-[14px]" />
      </td>
      <td className="p-4">
        <div className="skeleton w-[50px] h-[16px] rounded-full" />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="skeleton w-[80px] h-[14px]" />
        </div>
      </td>
      <td className="p-4">
        <div className="skeleton w-[60px] h-[14px]" />
      </td>
      <td className="p-4">
        <div className="skeleton w-[60%] h-[14px]" />
      </td>
      <td className="p-4">
        <div className="skeleton w-[80px] h-[14px]" />
      </td>
    </tr>
  );
}
