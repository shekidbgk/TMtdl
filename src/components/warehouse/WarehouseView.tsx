import React, { useState } from 'react';
import {
  Package,
  Wine,
  ChefHat,
  Search,
  Download,
  Send,
  Edit3,
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  Check,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import {
  ALLOWED_UNITS,
  ProductItem,
  ProductUnit,
  WarehouseType,
} from '../../types';
import {
  canAccessWarehouse,
  generateInventoryCsv,
  hasPermission,
} from '../../utils/logic';

export const WarehouseView: React.FC = () => {
  const {
    currentUser,
    currentOutletId,
    outlets,
    products,
    reports,
    permissions,
    updateProductCount,
    addProduct,
    updateProduct,
    deleteProduct,
    submitInventoryReport,
  } = useApp();

  if (!currentUser) return null;

  // Determine initial warehouse based on role
  const initialWarehouse: WarehouseType =
    currentUser.role === 'head_chef' || currentUser.role === 'cook' ? 'kitchen' : 'bar';

  const [activeWarehouse, setActiveWarehouse] = useState<WarehouseType>(initialWarehouse);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditProductsModalOpen, setIsEditProductsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // New product form in Editor
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdUnit, setNewProdUnit] = useState<ProductUnit>('бутылка');

  // Editing existing product state
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnit, setEditUnit] = useState<ProductUnit>('бутылка');

  const currentOutlet = outlets.find((o) => o.id === currentOutletId) || outlets[0];

  // Access checks
  const canAccessBar = canAccessWarehouse(currentUser.role, 'bar');
  const canAccessKitchen = canAccessWarehouse(currentUser.role, 'kitchen');

  const canEditProducts =
    hasPermission(currentUser.role, 'canEditProducts', permissions) &&
    (currentUser.role === 'admin' ||
      (currentUser.role === 'head_bartender' && activeWarehouse === 'bar') ||
      (currentUser.role === 'head_chef' && activeWarehouse === 'kitchen'));

  // Filter products by current outlet and active warehouse
  const warehouseProducts = products.filter(
    (p) => p.warehouse === activeWarehouse && p.outletId === currentOutletId
  );

  // Categories list for filter
  const categories = Array.from(new Set(warehouseProducts.map((p) => p.category))).filter(Boolean);

  const displayedProducts = warehouseProducts.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle CSV Download
  const handleDownloadCsv = () => {
    const warehouseName = activeWarehouse === 'bar' ? 'Склад Бара' : 'Склад Кухни';
    const csvContent = generateInventoryCsv({
      outletName: currentOutlet ? currentOutlet.name : 'Точка продаж',
      warehouseName,
      submittedBy: `${currentUser.name} (${currentUser.role})`,
      submittedAt: new Date().toISOString(),
      items: warehouseProducts.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        actualCount: p.actualCount ?? 0,
      })),
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `Инвентаризация_${activeWarehouse}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Submit to Administrator
  const handleSubmitReport = () => {
    const report = submitInventoryReport(activeWarehouse);
    const warehouseName = activeWarehouse === 'bar' ? 'Склада Бара' : 'Склада Кухни';
    setSubmitSuccessMsg(
      `Отчет по ${warehouseName} (${report.items.length} поз.) успешно отправлен Администратору!`
    );
    setTimeout(() => setSubmitSuccessMsg(null), 5000);
  };

  const handleAddNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCategory.trim()) return;

    addProduct({
      outletId: currentOutletId,
      warehouse: activeWarehouse,
      name: newProdName.trim(),
      category: newProdCategory.trim(),
      unit: newProdUnit,
      actualCount: null,
    });

    setNewProdName('');
    setNewProdCategory('');
    setNewProdUnit('бутылка');
  };

  const startEditProduct = (prod: ProductItem) => {
    setEditingProdId(prod.id);
    setEditName(prod.name);
    setEditCategory(prod.category);
    setEditUnit(prod.unit);
  };

  const saveEditProduct = (id: string) => {
    if (!editName.trim() || !editCategory.trim()) return;
    updateProduct(id, {
      name: editName.trim(),
      category: editCategory.trim(),
      unit: editUnit,
    });
    setEditingProdId(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Warehouse Switcher: «Склад Бара» и «Склад Кухни» */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-neutral-900 border border-neutral-800">
        <button
          type="button"
          disabled={!canAccessBar}
          onClick={() => {
            setActiveWarehouse('bar');
            setSelectedCategory('all');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            activeWarehouse === 'bar'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : canAccessBar
              ? 'text-neutral-400 hover:text-neutral-200'
              : 'text-neutral-600 cursor-not-allowed opacity-35'
          }`}
        >
          <Wine className="w-4 h-4" />
          <span>Склад Бара</span>
          {!canAccessBar && <span className="text-[9px] font-normal">(нет доступа)</span>}
        </button>

        <button
          type="button"
          disabled={!canAccessKitchen}
          onClick={() => {
            setActiveWarehouse('kitchen');
            setSelectedCategory('all');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            activeWarehouse === 'kitchen'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : canAccessKitchen
              ? 'text-neutral-400 hover:text-neutral-200'
              : 'text-neutral-600 cursor-not-allowed opacity-35'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Склад Кухни</span>
          {!canAccessKitchen && <span className="text-[9px] font-normal">(нет доступа)</span>}
        </button>
      </div>

      {/* Success Banner */}
      {submitSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{submitSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitSuccessMsg(null)}
            className="p-1 text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Warehouse Action Bar (Send to Admin, Download CSV, Edit Products) */}
      <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-400" />
              Инвентаризация: {activeWarehouse === 'bar' ? 'Склад Бара' : 'Склад Кухни'}
            </h3>
            <p className="text-[11px] text-neutral-400">
              Позиций на учете: <strong>{warehouseProducts.length}</strong> • Точка: {currentOutlet?.name}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {reports.length > 0 && (
              <button
                type="button"
                onClick={() => setIsReportsModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700 transition active:scale-95"
                title="История отправленных отчетов"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">История</span>
              </button>
            )}

            {canEditProducts && (
              <button
                type="button"
                onClick={() => setIsEditProductsModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-800 text-amber-300 hover:bg-neutral-700 text-xs font-semibold border border-amber-500/30 transition active:scale-95"
                title="Редактировать справочник продукции"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Продукция</span>
              </button>
            )}
          </div>
        </div>

        {/* Buttons: Submit to Admin & Download CSV / Excel */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={handleSubmitReport}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 active:scale-95 transition shadow-md shadow-amber-500/10"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Отправить Администратору</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 active:scale-95 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Скачать CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* 3. Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, категории или единице..."
            className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">Все категории ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 4. Inventory Count Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-sm">
        <div className="p-3 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span className="font-bold uppercase tracking-wider">
            Остатки на складе ({displayedProducts.length})
          </span>
          <span className="text-[11px] text-amber-400 italic">
            * Автосохранение при вводе
          </span>
        </div>

        {displayedProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Позиции не найдены
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {displayedProducts.map((product) => {
              const hasCount = product.actualCount !== null && product.actualCount !== undefined;
              const isLowStock =
                product.minWarningCount &&
                hasCount &&
                (product.actualCount as number) <= product.minWarningCount;

              return (
                <div
                  key={product.id}
                  className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-800/40 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                        {product.category}
                      </span>
                      {isLowStock && (
                        <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                          Мало!
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-neutral-100 truncate">
                      {product.name}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Ед. изм.: <span className="text-amber-300">{product.unit}</span>
                      {product.lastUpdated && (
                        <span className="text-neutral-500 ml-2">• обновлено {product.lastUpdated}</span>
                      )}
                    </div>
                  </div>

                  {/* Actual Count Input (Auto-saves immediately into localStorage) */}
                  <div className="w-24 sm:w-28 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={product.actualCount !== null && product.actualCount !== undefined ? product.actualCount : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                          updateProductCount(product.id, isNaN(val as number) ? null : val);
                        }}
                        placeholder="0.0"
                        className="w-full text-right font-mono text-sm font-bold bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition"
                        aria-label={`Остаток для ${product.name}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Catalog Editor Modal (Add/Edit/Delete, Units strictly from list) */}
      {isEditProductsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Редактор номенклатуры ({activeWarehouse === 'bar' ? 'Бар' : 'Кухня'})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditProductsModalOpen(false);
                  setEditingProdId(null);
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add New Product Form */}
            <form
              onSubmit={handleAddNewProductSubmit}
              className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 mb-4 space-y-2.5"
            >
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить новый товар</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Наименование позиции..."
                  className="rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                />

                <input
                  type="text"
                  required
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  placeholder="Категория (напр. Ликеры)..."
                  className="rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] text-neutral-400 shrink-0">Единица измерения:</label>
                <select
                  value={newProdUnit}
                  onChange={(e) => setNewProdUnit(e.target.value as ProductUnit)}
                  className="flex-1 rounded-lg bg-neutral-900 border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-100 focus:border-amber-400 focus:outline-none"
                >
                  {ALLOWED_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 active:scale-95 transition shrink-0"
                >
                  + Добавить
                </button>
              </div>
            </form>

            {/* Existing Products List for Edit / Delete */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Текущие товары на складе ({warehouseProducts.length}):
              </div>

              {warehouseProducts.map((p) => {
                const isEditing = editingProdId === p.id;

                if (isEditing) {
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-neutral-950 border border-amber-500/50 space-y-2"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-2 py-1 text-xs text-neutral-100"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="rounded-lg bg-neutral-900 border border-neutral-700 px-2 py-1 text-xs text-neutral-100"
                        />
                        <select
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value as ProductUnit)}
                          className="rounded-lg bg-neutral-900 border border-neutral-700 px-2 py-1 text-xs text-neutral-100"
                        >
                          {ALLOWED_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingProdId(null)}
                          className="px-2 py-1 text-xs rounded bg-neutral-800 text-neutral-300"
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditProduct(p.id)}
                          className="px-2 py-1 text-xs rounded bg-amber-500 text-neutral-950 font-bold"
                        >
                          Сохранить
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-neutral-200 truncate">{p.name}</div>
                      <div className="text-[10px] text-neutral-400">
                        {p.category} • {p.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditProduct(p)}
                        className="p-1 rounded text-neutral-400 hover:text-amber-300 hover:bg-neutral-800"
                        title="Редактировать"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(p.id)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsEditProductsModalOpen(false);
                setEditingProdId(null);
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition"
            >
              Закрыть редактор
            </button>
          </div>
        </div>
      )}

      {/* History of Sent Reports Modal */}
      {isReportsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                История инвентаризаций ({reports.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsReportsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">
                      {r.warehouseName} • {r.outletName}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {new Date(r.submittedAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">Сдал: {r.submittedBy}</div>
                  <div className="text-[11px] text-neutral-500">
                    Зафиксировано позиций: {r.items.length}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsReportsModalOpen(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
