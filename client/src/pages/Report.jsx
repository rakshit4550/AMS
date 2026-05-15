import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAccounts, fetchParties } from "../redux/accountSlice";
import Select from "react-select";
import { jsPDF } from "jspdf";
import { FaFileDownload, FaFilter, FaTimes } from "react-icons/fa";
import { TbReportAnalytics } from "react-icons/tb";

// Utility function to format numbers with commas
const formatNumber = (number) => {
  if (number === undefined || number === null || isNaN(number)) return "0";
  return Number(number).toLocaleString("en-IN");
};

const Report = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accounts, parties, loading, error } = useSelector(
    (state) => state.account,
  );
  const [selectedParty, setSelectedParty] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");

  // Prepare options for react-select
  const partyOptions = [
    { value: "", label: "Select a Party" },
    ...parties.map((party) => ({ value: party._id, label: party.partyname })),
  ];

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    transactionType: "",
    verificationStatus: "",
  });

  useEffect(() => {
    dispatch(fetchParties())
      .unwrap()
      .catch((err) => {
        if (err === "No token available" || err.includes("Invalid token")) {
          navigate("/");
        }
      });
    dispatch(fetchAccounts())
      .unwrap()
      .catch((err) => {
        if (err === "No token available" || err.includes("Invalid token")) {
          navigate("/");
        }
      });
  }, [dispatch, navigate]);

  // Handle clicks outside the filter popup to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePartyInputChange = (selectedOption) => {
    setSelectedParty(selectedOption ? selectedOption.value : "");
    setIsFilterOpen(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const toggleFilterPopup = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Download functionality
  const handleDownload = () => {
    if (!selectedParty) {
      alert("Please select a party to download the statement.");
      return;
    }
    const party = parties.find((p) => p._id === selectedParty);
    if (!party) {
      return;
    }
    const validAccounts = selectedPartyAccounts
      .filter((acc) => acc && acc.date && !isNaN(new Date(acc.date)))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (validAccounts.length === 0) {
      alert("No valid accounts available for this party.");
      return;
    }

    const doc = new jsPDF();
    let y = 20;
    let page = 1;

    // Header
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 210, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text(`${party.partyname} Statement`, 10, 10);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "normal");
    y += 10;

    // Calculate balance
    const balance = validAccounts.reduce(
      (sum, acc) => sum + (acc.debit || 0) - (acc.credit || 0),
      0,
    );
    const balSign = balance > 0 ? "Dr" : balance < 0 ? "Cr" : "";
    const balValue = formatNumber(Math.abs(balance));
    const balanceTextColor = balSign === "Cr" ? [0, 128, 0] : [255, 0, 0];

    // Closing Balance Box (Right Side, Above Table)
    const boxX = 130;
    const boxWidth = 70;
    const boxHeight = 20;
    const bgColor =
      balance > 0
        ? [255, 200, 200]
        : balance < 0
          ? [200, 255, 200]
          : [240, 240, 240];
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(boxX, y, boxWidth, boxHeight, "F");
    doc.setDrawColor(150, 150, 150);
    doc.rect(boxX, y, boxWidth, boxHeight);
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.setTextColor(
      balanceTextColor[0],
      balanceTextColor[1],
      balanceTextColor[2],
    );
    doc.text("Closing Balance", boxX + 5, y + 8);
    doc.setFont("times", "normal");
    doc.setTextColor(
      balanceTextColor[0],
      balanceTextColor[1],
      balanceTextColor[2],
    );
    doc.text(`Rs. ${balValue} ${balSign}`, boxX + 5, y + 16);
    y += 25;

    // Table setup
    const tableX = 10;
    const tableWidth = 190;
    const colWidths = [35, 35, 35, 35, 50];
    const baseRowHeight = 8;
    const tableStartY = y;

    // Table header
    doc.setFillColor(0, 51, 102);
    doc.rect(tableX, y, tableWidth, baseRowHeight, "F");
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.setFont("times", "bold");
    doc.text("Date", tableX + 2, y + 6);
    doc.text("Debit (-)", tableX + 37, y + 6);
    doc.text("Credit (+)", tableX + 72, y + 6);
    doc.text("Balance", tableX + 107, y + 6);
    doc.text("Remark", tableX + 142, y + 6);
    y += baseRowHeight;
    doc.setFont("times", "normal");
    doc.setTextColor(0, 0, 0);

    const formatDate = (date) => {
      if (!date || isNaN(new Date(date))) return "N/A";
      const options = { day: "numeric", month: "short", year: "numeric" };
      return new Date(date).toLocaleDateString("en-GB", options);
    };

    // Create reverse sorted accounts for balance calculation
    const reverseSortedAccounts = [...validAccounts].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

    validAccounts.forEach((acc, rowIndex) => {
      // Reverse balance calculation
      const reverseIndex = validAccounts.length - rowIndex - 1;
      let currentBalance = 0;
      const accountsUpToReverseIndex = reverseSortedAccounts.slice(
        0,
        reverseIndex + 1,
      );
      accountsUpToReverseIndex.forEach((acc) => {
        currentBalance += (acc.debit || 0) - (acc.credit || 0);
      });
      const curBalSign =
        currentBalance > 0 ? "Dr" : currentBalance < 0 ? "Cr" : "";
      const curBalValue = formatNumber(Math.abs(currentBalance));
      const currentBalanceTextColor =
        curBalSign === "Cr" ? [0, 128, 0] : [255, 0, 0];

      // Handle remark and calculate dynamic row height
      const remarkText = acc.remark || "";
      const maxWidth = colWidths[4] - 4;
      const splitText = doc.splitTextToSize(remarkText, maxWidth);
      const textHeight = splitText.length * 5;
      const rowHeight = Math.max(baseRowHeight, textHeight);

      // Draw row background if even
      if (rowIndex % 2 === 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(tableX, y, tableWidth, rowHeight, "F");
      }

      // Draw single row border for the entire table row
      doc.setDrawColor(150, 150, 150);
      doc.rect(tableX, y, tableWidth, rowHeight);

      let x = tableX;
      let lineY = y + 6;
      colWidths.forEach((width, i) => {
        if (i === 0) doc.text(formatDate(acc.date), x + 2, lineY);
        if (i === 1 && (acc.debit || 0) > 0) {
          doc.setTextColor(255, 0, 0);
          doc.text(formatNumber(acc.debit || 0), x + 2, lineY);
          doc.setTextColor(0, 0, 0);
        }
        if (i === 2 && (acc.credit || 0) > 0) {
          doc.setTextColor(0, 128, 0);
          doc.text(formatNumber(acc.credit || 0), x + 2, lineY);
          doc.setTextColor(0, 0, 0);
        }
        if (i === 3) {
          doc.setTextColor(
            currentBalanceTextColor[0],
            currentBalanceTextColor[1],
            currentBalanceTextColor[2],
          );
          doc.text(`${curBalValue} ${curBalSign}`, x + 2, lineY);
          doc.setTextColor(0, 0, 0);
        }
        if (i === 4) {
          let textY = y + 4;
          splitText.forEach((line, index) => {
            doc.text(line, x + 2, textY + index * 5);
          });
        }
        x += width;
      });

      y += rowHeight;

      // Check if we need a new page
      if (y > 260 && rowIndex < validAccounts.length - 1) {
        doc.addPage();
        y = 20;
        page++;
        doc.setFillColor(0, 51, 102);
        doc.rect(0, 0, 210, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        doc.text(`${party.partyname} Statement`, 10, 10);
        y += 15;

        // Closing Balance Box (Right Side, Above Table) - NEW PAGE
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(boxX, y, boxWidth, boxHeight, "F");
        doc.setDrawColor(150, 150, 150);
        doc.rect(boxX, y, boxWidth, boxHeight);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.setTextColor(
          balanceTextColor[0],
          balanceTextColor[1],
          balanceTextColor[2],
        );
        doc.text("Closing Balance", boxX + 5, y + 8);
        doc.setFont("times", "normal");
        doc.setTextColor(
          balanceTextColor[0],
          balanceTextColor[1],
          balanceTextColor[2],
        );
        doc.text(`Rs. ${balValue} ${balSign}`, boxX + 5, y + 16);
        y += 25;

        doc.setFillColor(0, 51, 102);
        doc.rect(tableX, y, tableWidth, baseRowHeight, "F");
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.setFont("times", "bold");
        doc.text("Date", tableX + 2, y + 6);
        doc.text("Debit (-)", tableX + 37, y + 6);
        doc.text("Credit (+)", tableX + 72, y + 6);
        doc.text("Balance", tableX + 107, y + 6);
        doc.text("Remark", tableX + 142, y + 6);
        y += baseRowHeight;
        doc.setFont("times", "normal");
        doc.setTextColor(0, 0, 0);
      }
    });

    // Add report generation timestamp
    y += 15;
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = now.getHours() >= 12 ? "PM" : "AM";
    const genDate = formatDate(now).replace(
      /\d{4}$/,
      `'${now.getFullYear().toString().slice(2)}`,
    );
    const genTime = `${hours}:${minutes} ${ampm} | ${genDate}`;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Generated: ${genTime}`, tableX, y);

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    setPdfPreviewUrl(pdfUrl);
    setPdfFileName(`${party.partyname}_account_statement.pdf`);
    setShowPdfPreview(true);
  };

  const handleFinalDownload = () => {
    const link = document.createElement("a");
    link.href = pdfPreviewUrl;
    link.download = pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowPdfPreview(false);
    URL.revokeObjectURL(pdfPreviewUrl);
  };

  // Filter accounts for the selected party and apply advanced filters
  const selectedPartyAccounts = selectedParty
    ? accounts.filter((account) => {
        if (account.partyname?._id !== selectedParty) return false;

        // Date range filter
        if (
          filters.startDate &&
          new Date(account.date) < new Date(filters.startDate)
        )
          return false;
        if (
          filters.endDate &&
          new Date(account.date) > new Date(filters.endDate)
        )
          return false;

        // Transaction type filter
        if (filters.transactionType) {
          if (filters.transactionType === "credit" && account.credit <= 0)
            return false;
          if (filters.transactionType === "debit" && account.debit <= 0)
            return false;
        }

        // Verification status filter
        if (filters.verificationStatus) {
          if (filters.verificationStatus === "verified" && !account.verified)
            return false;
          if (filters.verificationStatus === "unverified" && account.verified)
            return false;
        }

        return true;
      })
    : [];

  // Sort accounts by createdAt timestamp (newest to oldest)
  const sortedAccounts = [...(selectedPartyAccounts || [])].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const n = sortedAccounts.length;
  const rowRunningBalances = new Array(n);
  let balanceSuffix = 0;
  for (let i = n - 1; i >= 0; i--) {
    const acc = sortedAccounts[i];
    balanceSuffix += (acc.debit || 0) - (acc.credit || 0);
    rowRunningBalances[i] = balanceSuffix;
  }

  const totalDebit = (selectedPartyAccounts || []).reduce(
    (sum, account) => sum + (account.debit || 0),
    0,
  );
  const totalCredit = (selectedPartyAccounts || []).reduce(
    (sum, account) => sum + (account.credit || 0),
    0,
  );
  const balance = totalDebit - totalCredit;
  const balSign = balance > 0 ? "Dr" : balance < 0 ? "Cr" : "";
  const balValue = formatNumber(Math.abs(balance));
  const balanceColor =
    balance > 0
      ? "text-red-600"
      : balance < 0
        ? "text-green-600"
        : "text-gray-800";

  const portalSelectStyles = {
    control: (base) => ({
      ...base,
      minHeight: 32,
      fontSize: "0.8125rem",
      borderColor: "#cbd5e1",
      paddingLeft: 4,
      paddingRight: 4,
      borderRadius: "0.375rem",
      boxShadow: "none",
      "&:hover": { borderColor: "#424687" },
    }),
    placeholder: (base) => ({ ...base, fontSize: "0.8125rem" }),
    singleValue: (base) => ({ ...base, fontSize: "0.8125rem" }),
    input: (base) => ({ ...base, fontSize: "0.8125rem" }),
    menu: (base) => ({ ...base, zIndex: 10002 }),
    menuPortal: (base) => ({ ...base, zIndex: 10002 }),
    menuList: (base) => ({ ...base, maxHeight: 280 }),
  };

  const selectPortalProps = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    menuPlacement: "auto",
  };

  const fieldClass =
    "h-8 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40";

  // Get the party name for the selected party
  const selectedPartyName = selectedParty
    ? parties.find((party) => party._id === selectedParty)?.partyname ||
      "Selected Party"
    : "";

  return (
    <div className="z-[99] min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-2">
        {/* Toolbar */}
        <div className="w-full overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-sm ring-1 ring-slate-100/80 backdrop-blur-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-3 py-2 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Selection &amp; export
            </p>
          </div>
          <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:px-4 sm:py-3.5">
            <div className="min-w-0 w-full sm:max-w-md lg:max-w-xl">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                Party
              </label>
              <Select
                options={partyOptions.filter((option) => option.value !== "")}
                value={
                  partyOptions.find(
                    (option) => option.value === selectedParty,
                  ) || null
                }
                onChange={handlePartyInputChange}
                placeholder="Search or select party…"
                className="w-full"
                classNamePrefix="select"
                isClearable
                isSearchable
                {...selectPortalProps}
                styles={portalSelectStyles}
              />
            </div>
            {selectedParty && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                <button
                  type="button"
                  onClick={toggleFilterPopup}
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-[#424687] shadow-sm transition hover:border-[#424687]/30 hover:bg-[#424687]/5 sm:h-9 sm:text-sm"
                >
                  <FaFilter className="h-3.5 w-3.5 opacity-80" aria-hidden />
                  {isFilterOpen ? "Close filters" : "Filters"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-[#424687] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#353a6e] sm:h-9 sm:text-sm"
                  title="Download Statement"
                >
                  <FaFileDownload
                    className="h-3.5 w-3.5 opacity-90"
                    aria-hidden
                  />
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter drawer */}
        {isFilterOpen && selectedParty && (
          <>
            <button
              type="button"
              aria-label="Close filter overlay"
              className="fixed inset-0 z-[10040] bg-black/40 transition-opacity"
              onClick={() => setIsFilterOpen(false)}
            />
            <div
              ref={filterRef}
              className="fixed right-0 top-0 z-[10050] flex h-full w-full max-w-md flex-col border-l border-slate-200/90 bg-white shadow-2xl sm:rounded-l-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#424687] to-[#353a6e] px-4 py-4 text-white sm:px-5 sm:rounded-tl-2xl">
                <div className="min-w-0">
                  <h3 className="text-base font-bold sm:text-lg">
                    Advanced filters
                  </h3>
                  <p className="mt-1 text-xs text-white/80">
                    Date range, transaction type, and verification.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="shrink-0 rounded-lg p-2 text-white/90 transition hover:bg-white/15 hover:text-white"
                  aria-label="Close filters"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Start date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    End date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Transaction type
                  </label>
                  <select
                    name="transactionType"
                    value={filters.transactionType}
                    onChange={handleFilterChange}
                    className={fieldClass}
                  >
                    <option value="">All</option>
                    <option value="credit">Credit (Dena)</option>
                    <option value="debit">Debit (Lena)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Verification status
                  </label>
                  <select
                    name="verificationStatus"
                    value={filters.verificationStatus}
                    onChange={handleFilterChange}
                    className={fieldClass}
                  >
                    <option value="">All</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50/80 p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full rounded-lg bg-[#424687] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#353a6e]"
                >
                  Apply filters
                </button>
              </div>
            </div>
          </>
        )}

        {/* Ledger card */}
        <div className="flex min-h-[min(72vh,calc(100vh-10rem))] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/60">
          {loading && (
            <div className="flex items-center justify-center gap-2 border-b border-slate-100 bg-slate-50 py-2.5 text-sm text-[#424687]">
              <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-[#424687]/40" />
              <span>Loading…</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center gap-2 border-b border-red-100 bg-red-50 px-3 py-2.5 text-center text-sm text-red-700">
              <span className="font-medium">{error}</span>
            </div>
          )}

          {selectedParty && selectedPartyAccounts.length > 0 ? (
            <>
              <div
                className={`flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 sm:px-4 ${
                  balance > 0
                    ? "bg-gradient-to-r from-red-50/80 to-white"
                    : balance < 0
                      ? "bg-gradient-to-r from-emerald-50/80 to-white"
                      : "bg-slate-50/90"
                }`}
              >
                <h3 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                  {selectedPartyName}
                  <span className="ml-2 font-normal text-slate-500">
                    · Statement
                  </span>
                </h3>
                <div
                  className={`rounded-lg border px-3 py-1.5 text-sm font-bold tabular-nums shadow-sm sm:text-base ${balanceColor} ${
                    balance > 0
                      ? "border-red-200/80 bg-white/90"
                      : balance < 0
                        ? "border-emerald-200/80 bg-white/90"
                        : "border-slate-200 bg-white/90"
                  }`}
                >
                  <span className="mr-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Closing
                  </span>
                  ₹ {balValue} {balSign}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead className="sticky top-0 z-10 shadow-sm">
                    <tr className="bg-[#424687] text-white">
                      <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                        Date
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                        Debit (-)
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                        Credit (+)
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                        Balance
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAccounts.map((account, index) => {
                      const currentBalance = rowRunningBalances[index];
                      const curBalSign =
                        currentBalance > 0
                          ? "Dr"
                          : currentBalance < 0
                            ? "Cr"
                            : "";
                      const curBalValue = formatNumber(
                        Math.abs(currentBalance),
                      );
                      const currentBalanceColor =
                        currentBalance > 0
                          ? "text-red-600"
                          : currentBalance < 0
                            ? "text-emerald-600"
                            : "text-slate-800";
                      return (
                        <tr
                          key={account._id}
                          className={`border-b border-slate-100/80 ${
                            index % 2 === 0 ? "bg-slate-50/60" : "bg-white"
                          } transition-colors hover:bg-indigo-50/40`}
                        >
                          <td
                            className={`whitespace-nowrap px-3 py-3 text-slate-800 ${
                              account.verified
                                ? "border-l-[3px]  pl-[10px]"
                                : "border-l-[3px]  pl-[10px]"
                            }`}
                          >
                            {new Date(account.date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-medium tabular-nums text-red-600">
                            {account.debit > 0
                              ? formatNumber(account.debit)
                              : ""}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-medium tabular-nums text-emerald-600">
                            {account.credit > 0
                              ? formatNumber(account.credit)
                              : ""}
                          </td>
                          <td
                            className={`whitespace-nowrap px-3 py-3 font-semibold tabular-nums ${currentBalanceColor}`}
                          >
                            ₹ {curBalValue} {curBalSign}
                          </td>
                          <td className="max-w-xs truncate px-3 py-3 text-slate-700 sm:max-w-md sm:whitespace-normal sm:break-words">
                            {account.remark || ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : selectedParty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <span className="rounded-full bg-slate-100 p-4 text-slate-400">
                <TbReportAnalytics className="h-8 w-8" aria-hidden />
              </span>
              <p className="max-w-sm text-sm font-medium text-slate-700">
                No accounts available for this party.
              </p>
              <p className="max-w-sm text-xs text-slate-500">
                Try another party or adjust filters if some rows are hidden.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <span className="rounded-full bg-[#424687]/10 p-4 text-[#424687]">
                <TbReportAnalytics className="h-8 w-8" aria-hidden />
              </span>
              <p className="max-w-sm text-sm font-medium text-slate-700">
                Select a party to open the statement.
              </p>
              <p className="max-w-xs text-xs text-slate-500">
                Use the party field above to load transactions for export.
              </p>
            </div>
          )}
        </div>
      </div>

      {showPdfPreview && (
        <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
          <div className="flex h-[min(95vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl ring-1 ring-slate-200/50">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-[#424687] to-[#353a6e] px-4 py-3.5 text-white sm:px-5">
              <div>
                <h2 className="text-base font-bold sm:text-lg">PDF preview</h2>
                <p className="text-xs text-white/75">
                  Review before downloading
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPdfPreview(false);
                  URL.revokeObjectURL(pdfPreviewUrl);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/25"
              >
                <FaTimes className="h-3.5 w-3.5" aria-hidden />
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-slate-200/90">
              <iframe
                src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                title="PDF Preview"
                className="h-full min-h-[50vh] w-full border-0"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => {
                  setShowPdfPreview(false);
                  URL.revokeObjectURL(pdfPreviewUrl);
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalDownload}
                className="rounded-lg bg-[#424687] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#353a6e]"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
