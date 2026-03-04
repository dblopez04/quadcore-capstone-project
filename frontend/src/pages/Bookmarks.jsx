import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import { useToast } from "../components/ToastProvider";

const ALL_BOOKMARKS_LIST_ID = "all-bookmarks";
const SEEDED_TEXT_PATTERN = /\bseeded from local osm extract\b\.?/ig;

/* ── Inline SVG Icons ──────────────────────────────────────── */
const Icon = {
    mapPin: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    trash: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    more: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="18" r="1.8" />
        </svg>
    ),
    plus: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    x: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    check: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    minus: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    arrowRight: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    ),
};

/* ── Helpers ────────────────────────────────────────────────── */
function cleanBookmarkSubtitle(value) {
    if (!value) return "";
    return value
        .replace(SEEDED_TEXT_PATTERN, "")
        .replace(/\s{2,}/g, " ")
        .replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, "")
        .trim();
}

function resolveLocationId(record) {
    return (
        record?.location_id ||
        record?.locationId ||
        record?.location?.location_id ||
        record?.location?.id ||
        null
    );
}

function resolveBookmarkId(record) {
    return record?.location_bookmark_id || record?.bookmark_id || record?.id || null;
}

function extractCoordinates(location) {
    const coords = location?.coordinates;
    if (coords?.type === "Point" && Array.isArray(coords.coordinates) && coords.coordinates.length >= 2) {
        return { lng: coords.coordinates[0], lat: coords.coordinates[1] };
    }
    return {
        lat: coords?.lat ?? coords?.latitude ?? null,
        lng: coords?.lng ?? coords?.lon ?? coords?.longitude ?? null,
    };
}

function normalizeList(list) {
    const items = Array.isArray(list?.items) ? list.items : [];
    return {
        ...list,
        item_count: list?.item_count ?? items.length,
        items: items.map((item) => ({ ...item, location_id: resolveLocationId(item) })),
    };
}

/* ── Component ──────────────────────────────────────────────── */
export default function Bookmarks() {
    const [bookmarks, setBookmarks] = useState([]);
    const [lists, setLists] = useState([]);
    const [selectedListId, setSelectedListId] = useState(ALL_BOOKMARKS_LIST_ID);
    const [newListName, setNewListName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // New UI state
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showNewListForm, setShowNewListForm] = useState(false);

    const navigate = useNavigate();
    const { showToast } = useToast();

    /* ── Derived data ──────────────────────────────────────── */
    const selectedList = useMemo(
        () => lists.find((list) => list.list_id === selectedListId) || null,
        [lists, selectedListId]
    );

    const listLocationSets = useMemo(() => {
        const map = new Map();
        for (const list of lists) {
            const locationSet = new Set(
                (Array.isArray(list.items) ? list.items : [])
                    .map((item) => resolveLocationId(item))
                    .filter(Boolean)
            );
            map.set(list.list_id, locationSet);
        }
        return map;
    }, [lists]);

    const selectedListLocationSet = useMemo(() => {
        if (!selectedList || selectedListId === ALL_BOOKMARKS_LIST_ID) return new Set();
        return listLocationSets.get(selectedList.list_id) || new Set();
    }, [listLocationSets, selectedList, selectedListId]);

    const rows = useMemo(() => {
        const mapped = bookmarks.map((bookmark, index) => {
            const location = bookmark?.location || null;
            const locationId = resolveLocationId(bookmark);
            const bookmarkId = resolveBookmarkId(bookmark);
            const rowId = bookmarkId || locationId || `bookmark-row-${index}`;
            const coordinates = extractCoordinates(location);
            return {
                rowId,
                locationId,
                bookmarkId,
                bookmark,
                location,
                title: bookmark?.custom_name || location?.name || "Untitled bookmark",
                subtitle: "",
                ...coordinates,
            };
        });

        // When viewing a specific list, filter to only that list's bookmarks
        if (selectedListId !== ALL_BOOKMARKS_LIST_ID) {
            return mapped.filter((row) => selectedListLocationSet.has(row.locationId));
        }

        return mapped;
    }, [bookmarks, selectedListId, selectedListLocationSet]);

    /* ── Data fetching ─────────────────────────────────────── */
    async function fetchBookmarksWithLocations(rawBookmarks) {
        const normalized = rawBookmarks.map((bookmark) => ({
            ...bookmark,
            location_id: resolveLocationId(bookmark),
        }));
        return Promise.all(
            normalized.map(async (bookmark) => {
                if (bookmark.location?.name) return bookmark;
                const locationId = resolveLocationId(bookmark);
                if (!locationId) return bookmark;
                try {
                    const locationData = await apiRequest(`/api/locations/${locationId}`);
                    return { ...bookmark, location: locationData.location || locationData || null };
                } catch {
                    return bookmark;
                }
            })
        );
    }

    async function loadBookmarkData() {
        setLoading(true);
        setError("");
        try {
            const [bookmarkData, listData] = await Promise.all([
                apiRequest("/api/locations/bookmarks"),
                apiRequest("/api/locations/lists"),
            ]);
            const bookmarkList = Array.isArray(bookmarkData)
                ? bookmarkData
                : (bookmarkData.bookmarks || bookmarkData.results || []);
            const customLists = Array.isArray(listData?.lists)
                ? listData.lists.map(normalizeList)
                : [];
            const enrichedBookmarks = await fetchBookmarksWithLocations(bookmarkList);
            setBookmarks(enrichedBookmarks);
            setLists(customLists);
            setSelectedListId((current) => {
                if (current === ALL_BOOKMARKS_LIST_ID) return current;
                return customLists.some((list) => list.list_id === current)
                    ? current
                    : ALL_BOOKMARKS_LIST_ID;
            });
        } catch (err) {
            console.error("Failed to load bookmark data:", err);
            setBookmarks([]);
            setLists([]);
            setSelectedListId(ALL_BOOKMARKS_LIST_ID);
            setError(err.message || "Failed to load bookmarks.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBookmarkData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        if (!openMenuId) return;
        function onClickOutside(e) {
            if (!e.target.closest(".bk-card-menu")) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("click", onClickOutside);
        return () => document.removeEventListener("click", onClickOutside);
    }, [openMenuId]);

    /* ── Handlers ──────────────────────────────────────────── */
    async function handleCreateList(event) {
        event.preventDefault();
        const listName = newListName.trim();
        if (!listName) {
            showToast("Enter a list name.", "error");
            return;
        }
        setSaving(true);
        try {
            const response = await apiRequest("/api/locations/lists", {
                method: "POST",
                body: JSON.stringify({ name: listName }),
            });
            setNewListName("");
            setShowNewListForm(false);
            if (response?.list?.list_id) {
                setSelectedListId(response.list.list_id);
            }
            await loadBookmarkData();
            showToast(response?.message || "List created.", "success");
        } catch (err) {
            console.error("Create list failed:", err);
            showToast(err.message || "Failed to create list.", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleRenameSelectedList() {
        if (!selectedList || selectedListId === ALL_BOOKMARKS_LIST_ID) return;
        const nextName = window.prompt("Rename list", selectedList.name);
        if (nextName === null) return;
        const trimmedName = nextName.trim();
        if (!trimmedName) {
            showToast("List name cannot be empty.", "error");
            return;
        }
        setSaving(true);
        try {
            const response = await apiRequest(`/api/locations/lists/${selectedList.list_id}`, {
                method: "PATCH",
                body: JSON.stringify({ name: trimmedName }),
            });
            await loadBookmarkData();
            showToast(response?.message || "List renamed.", "success");
        } catch (err) {
            console.error("Rename list failed:", err);
            showToast(err.message || "Failed to rename list.", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteSelectedList() {
        if (!selectedList || selectedListId === ALL_BOOKMARKS_LIST_ID) return;
        const confirmed = window.confirm(`Delete "${selectedList.name}"?`);
        if (!confirmed) return;
        setSaving(true);
        try {
            const response = await apiRequest(`/api/locations/lists/${selectedList.list_id}`, {
                method: "DELETE",
            });
            setSelectedListId(ALL_BOOKMARKS_LIST_ID);
            await loadBookmarkData();
            showToast(response?.message || "List deleted.", "success");
        } catch (err) {
            console.error("Delete list failed:", err);
            showToast(err.message || "Failed to delete list.", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleListItem(row, listId) {
        if (!row.locationId || !listId) return;
        setSaving(true);
        setOpenMenuId(null);
        try {
            const listSet = listLocationSets.get(listId) || new Set();
            const alreadyInList = listSet.has(row.locationId);
            const response = alreadyInList
                ? await apiRequest(`/api/locations/lists/${listId}/items/${row.locationId}`, { method: "DELETE" })
                : await apiRequest(`/api/locations/lists/${listId}/items`, {
                    method: "POST",
                    body: JSON.stringify({ location_id: row.locationId }),
                });
            await loadBookmarkData();
            showToast(
                response?.message || (alreadyInList ? "Removed from list." : "Added to list."),
                "success"
            );
        } catch (err) {
            console.error("Toggle list item failed:", err);
            showToast(err.message || "Failed to update list.", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleRemoveBookmark(row) {
        const bookmark = row?.bookmark;
        const bookmarkId = resolveBookmarkId(bookmark);
        const locationId = resolveLocationId(bookmark);
        if (!bookmarkId && !locationId) {
            showToast("Missing location id for this bookmark.", "error");
            return;
        }
        setOpenMenuId(null);
        setSaving(true);
        try {
            if (bookmarkId) {
                await apiRequest(`/api/locations/bookmarks/${bookmarkId}`, { method: "DELETE" });
            } else {
                await apiRequest(`/api/locations/${locationId}/bookmark`, { method: "DELETE" });
            }
            await loadBookmarkData();
            showToast("Bookmark removed.", "success");
        } catch (err) {
            console.error("Remove bookmark failed:", err);
            showToast(err.message || "Failed to remove bookmark.", "error");
        } finally {
            setSaving(false);
        }
    }

    function handleOpen(row) {
        if (row.lat == null || row.lng == null) {
            showToast("This location has no coordinates.", "error");
            return;
        }
        const name = row?.bookmark?.custom_name || row?.location?.name || "Bookmarked location";
        const params = new URLSearchParams({
            lat: String(row.lat),
            lng: String(row.lng),
            name,
        });
        navigate(`/map?${params.toString()}`);
    }

    function handleCardClick(row) {
        if (row.lat == null || row.lng == null) return;
        handleOpen(row);
    }

    const actionsDisabled = loading || saving;

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <div className="page">
            <div className="container">
                {/* Page header */}
                <div className="bk-page-header">
                    <h2 className="bk-page-title">Bookmarks</h2>
                </div>

                <div className="bookmarks-layout">
                    {/* ── Sidebar ──────────────────────────── */}
                    <aside className="bk-sidebar panel">
                        <div className="bk-sidebar-top">
                            <span className="bk-sidebar-label">Collections</span>
                            <button
                                className="bk-icon-btn"
                                onClick={() => setShowNewListForm(!showNewListForm)}
                                title={showNewListForm ? "Cancel" : "New list"}
                                disabled={actionsDisabled}
                            >
                                {showNewListForm ? Icon.x : Icon.plus}
                            </button>
                        </div>

                        {showNewListForm && (
                            <form onSubmit={handleCreateList} className="bk-create-form">
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="List name..."
                                    className="bk-create-input"
                                    maxLength={100}
                                    disabled={actionsDisabled}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="bk-create-btn"
                                    disabled={actionsDisabled || !newListName.trim()}
                                >
                                    Create
                                </button>
                            </form>
                        )}

                        <nav className="bk-list-nav">
                            <button
                                className={`bk-list-item ${selectedListId === ALL_BOOKMARKS_LIST_ID ? "active" : ""}`}
                                onClick={() => setSelectedListId(ALL_BOOKMARKS_LIST_ID)}
                                disabled={actionsDisabled}
                            >
                                <span className="bk-list-name">All Bookmarks</span>
                                <span className="bk-badge">{bookmarks.length}</span>
                            </button>

                            {lists.map((list) => (
                                <button
                                    key={list.list_id}
                                    className={`bk-list-item ${selectedListId === list.list_id ? "active" : ""}`}
                                    onClick={() => setSelectedListId(list.list_id)}
                                    disabled={actionsDisabled}
                                >
                                    <span className="bk-list-name">{list.name}</span>
                                    <span className="bk-badge">{list.item_count ?? list.items?.length ?? 0}</span>
                                </button>
                            ))}
                        </nav>

                        {selectedListId !== ALL_BOOKMARKS_LIST_ID && selectedList && (
                            <div className="bk-list-manage">
                                <button
                                    className="bk-text-btn"
                                    onClick={handleRenameSelectedList}
                                    disabled={actionsDisabled}
                                >
                                    Rename
                                </button>
                                <span className="bk-dot-sep">&middot;</span>
                                <button
                                    className="bk-text-btn danger"
                                    onClick={handleDeleteSelectedList}
                                    disabled={actionsDisabled}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </aside>

                    {/* ── Content ──────────────────────────── */}
                    <section className="bk-content">
                        <div className="bk-content-header">
                            <h3 className="bk-content-title">
                                {selectedListId === ALL_BOOKMARKS_LIST_ID
                                    ? "All Bookmarks"
                                    : selectedList?.name || "List"}
                            </h3>
                            {!loading && !error && (
                                <span className="bk-content-count">
                                    {rows.length} item{rows.length !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>

                        {loading && (
                            <div className="bk-status">
                                <div className="bk-spinner" />
                                <span>Loading bookmarks...</span>
                            </div>
                        )}

                        {error && <div className="bk-error">{error}</div>}

                        {!loading && !error && rows.length === 0 && (
                            <div className="bk-empty">
                                <div className="bk-empty-icon">
                                    {selectedListId === ALL_BOOKMARKS_LIST_ID ? (
                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--unt-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                        </svg>
                                    ) : (
                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--unt-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                        </svg>
                                    )}
                                </div>
                                <p className="bk-empty-title">
                                    {selectedListId === ALL_BOOKMARKS_LIST_ID
                                        ? "No bookmarks yet"
                                        : "This list is empty"}
                                </p>
                                <p className="bk-empty-hint">
                                    {selectedListId === ALL_BOOKMARKS_LIST_ID
                                        ? "Save locations from the map to see them here."
                                        : "Add bookmarks using the menu on each card."}
                                </p>
                            </div>
                        )}

                        {!loading && !error && rows.length > 0 && (
                            <div className="bk-cards">
                                {rows.map((row, index) => {
                                    const hasCoords = row.lat != null && row.lng != null;
                                    const menuOpen = openMenuId === row.rowId;

                                    return (
                                        <div
                                            key={row.rowId}
                                            className={`bk-card${hasCoords ? " bk-card--clickable" : ""}`}
                                            onClick={() => handleCardClick(row)}
                                            style={{ animationDelay: `${index * 0.035}s` }}
                                        >
                                            {/* Left accent for items in the selected list */}
                                            {selectedListId !== ALL_BOOKMARKS_LIST_ID && (
                                                <div className="bk-card-accent" />
                                            )}

                                            <div className="bk-card-body">
                                                <div className="bk-card-title">{row.title}</div>
                                                {row.subtitle && (
                                                    <div className="bk-card-subtitle">{row.subtitle}</div>
                                                )}
                                                {hasCoords && (
                                                    <div className="bk-card-hint">
                                                        {Icon.arrowRight}
                                                        <span>View on map</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Menu trigger */}
                                            <div
                                                className="bk-card-menu"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    className="bk-menu-trigger"
                                                    onClick={() => setOpenMenuId(menuOpen ? null : row.rowId)}
                                                    disabled={actionsDisabled}
                                                    aria-label="Actions"
                                                >
                                                    {Icon.more}
                                                </button>

                                                {menuOpen && (
                                                    <div className="bk-dropdown">
                                                        {/* Open on Map */}
                                                        {hasCoords && (
                                                            <button
                                                                className="bk-dropdown-item"
                                                                onClick={() => {
                                                                    setOpenMenuId(null);
                                                                    handleOpen(row);
                                                                }}
                                                            >
                                                                <span className="bk-dropdown-icon">{Icon.mapPin}</span>
                                                                Open on Map
                                                            </button>
                                                        )}

                                                        {/* Add to list (All Bookmarks view) */}
                                                        {lists.length > 0 && selectedListId === ALL_BOOKMARKS_LIST_ID && (
                                                            <>
                                                                <div className="bk-dropdown-sep" />
                                                                <div className="bk-dropdown-label">Add to list</div>
                                                                {lists.map((list) => {
                                                                    const inThis = (listLocationSets.get(list.list_id) || new Set()).has(row.locationId);
                                                                    return (
                                                                        <button
                                                                            key={list.list_id}
                                                                            className={`bk-dropdown-item bk-dropdown-item--list${inThis ? " checked" : ""}`}
                                                                            onClick={() => handleToggleListItem(row, list.list_id)}
                                                                            disabled={actionsDisabled}
                                                                        >
                                                                            <span className="bk-dropdown-check">
                                                                                {inThis ? Icon.check : null}
                                                                            </span>
                                                                            {list.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </>
                                                        )}

                                                        {/* Remove from list (list view) */}
                                                        {selectedListId !== ALL_BOOKMARKS_LIST_ID && selectedList && (
                                                            <>
                                                                <div className="bk-dropdown-sep" />
                                                                <button
                                                                    className="bk-dropdown-item"
                                                                    onClick={() => handleToggleListItem(row, selectedListId)}
                                                                    disabled={actionsDisabled}
                                                                >
                                                                    <span className="bk-dropdown-icon">{Icon.minus}</span>
                                                                    Remove from List
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Remove Bookmark (always) */}
                                                        <div className="bk-dropdown-sep" />
                                                        <button
                                                            className="bk-dropdown-item bk-dropdown-item--danger"
                                                            onClick={() => handleRemoveBookmark(row)}
                                                            disabled={actionsDisabled}
                                                        >
                                                            <span className="bk-dropdown-icon">{Icon.trash}</span>
                                                            Remove Bookmark
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* History placeholder */}
                <div className="bk-history panel">
                    <h3 className="bk-history-title">History</h3>
                    <p className="bk-history-placeholder">
                        Recently visited locations will appear here.
                    </p>
                </div>
            </div>
        </div>
    );
}
