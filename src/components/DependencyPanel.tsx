import { useState, useCallback, useRef, useEffect } from 'react';
import { Text, Spinner } from 'ui_zenkit';
import { useToastStore } from '../store';

interface NpmPackage {
  name: string;
  version: string;
  description: string;
}

interface DependencyPanelProps {
  dependencies: Record<string, string>;
  onAddDependency: (name: string, version: string) => void;
  onRemoveDependency: (name: string) => void;
}

export function DependencyPanel({
  dependencies,
  onAddDependency,
  onRemoveDependency,
}: DependencyPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NpmPackage[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toast = useToastStore();

  // Search npm registry
  const searchNpm = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      // Use npm registry search API
      const response = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=10`
      );
      const data = await response.json();
      const packages: NpmPackage[] = data.objects.map((obj: { package: { name: string; version: string; description?: string } }) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description || 'No description',
      }));
      setSearchResults(packages);
      setShowResults(true);
    } catch {
      toast.error('Search failed', 'Could not search npm packages');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [toast]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchNpm(value);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Handle add dependency
  const handleAddDependency = (pkg: NpmPackage) => {
    if (dependencies[pkg.name]) {
      toast.warning('Already installed', `${pkg.name} is already in dependencies`);
      return;
    }
    onAddDependency(pkg.name, `^${pkg.version}`);
    toast.success('Dependency added', `Added ${pkg.name}@${pkg.version}`);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  // Handle remove dependency
  const handleRemoveDependency = (name: string) => {
    onRemoveDependency(name);
    toast.success('Dependency removed', `Removed ${name}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dependencyList = Object.entries(dependencies);

  return (
    <div ref={panelRef} style={{ padding: '0.75rem' }}>
      <Text size="sm" weight="medium" style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        DEPENDENCIES
      </Text>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
            fontSize: '14px',
            pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          {searching && (
            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
              <Spinner size="sm" />
            </div>
          )}
        </div>

        {/* Search Results Dropdown - positioned above dependencies list */}
        {showResults && searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '6px',
              maxHeight: '240px',
              overflowY: 'auto',
              zIndex: 9999,
              marginTop: '4px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            {searchResults.map((pkg, index) => (
              <div
                key={pkg.name}
                onClick={() => handleAddDependency(pkg)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: '#1e293b',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #334155' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#334155';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#1e293b';
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>
                    {pkg.name}
                  </span>
                </div>
                <span style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  flexShrink: 0,
                }}>
                  {pkg.version}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Installed Dependencies - CodeSandbox style */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {dependencyList.length === 0 ? (
          <Text size="sm" style={{ color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
            No dependencies installed
          </Text>
        ) : (
          dependencyList.map(([name, version]) => (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: '4px',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                const actions = e.currentTarget.querySelector('.dep-actions') as HTMLElement;
                if (actions) actions.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                const actions = e.currentTarget.querySelector('.dep-actions') as HTMLElement;
                if (actions) actions.style.opacity = '0';
              }}
            >
              <span style={{ fontSize: '14px' }}>📦</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{name}</span>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>{version}</span>
              </div>
              <div
                className="dep-actions"
                style={{
                  display: 'flex',
                  gap: '4px',
                  opacity: 0,
                  transition: 'opacity 0.15s',
                }}
              >
                <button
                  onClick={() => window.open(`https://www.npmjs.com/package/${name}`, '_blank')}
                  title="View on npm"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '2px',
                    fontSize: '12px',
                  }}
                >
                  ↗
                </button>
                <button
                  onClick={() => handleRemoveDependency(name)}
                  title="Remove dependency"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '2px',
                    fontSize: '12px',
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
