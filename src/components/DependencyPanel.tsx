import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Button,
  Text,
  Stack,
  Group,
  Input,
  Spinner,
  Badge,
} from 'ui_zenkit';
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
      const packages: NpmPackage[] = data.objects.map((obj: any) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description || 'No description',
      }));
      setSearchResults(packages);
      setShowResults(true);
    } catch (error) {
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
        <Input
          placeholder="Search npm packages..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
        />
        {searching && (
          <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
            <Spinner size="sm" />
          </div>
        )}

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--surface-3)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 100,
              marginTop: '4px',
            }}
          >
            {searchResults.map((pkg) => (
              <div
                key={pkg.name}
                onClick={() => handleAddDependency(pkg)}
                style={{
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'transparent';
                }}
              >
                <Group justify="apart" align="start">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" weight="medium">
                      {pkg.name}
                    </Text>
                    <Text
                      size="sm"
                      style={{
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pkg.description}
                    </Text>
                  </div>
                  <Badge size="sm" color="secondary">
                    {pkg.version}
                  </Badge>
                </Group>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Installed Dependencies */}
      <Stack spacing="xs">
        {dependencyList.length === 0 ? (
          <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
            No dependencies installed
          </Text>
        ) : (
          dependencyList.map(([name, version]) => (
            <Group
              key={name}
              justify="apart"
              align="center"
              style={{
                padding: '0.5rem',
                background: 'var(--surface-3)',
                borderRadius: '4px',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <Text size="sm" weight="medium" style={{ wordBreak: 'break-all' }}>
                  {name}
                </Text>
                <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                  {version}
                </Text>
              </div>
              <Button
                variant="ghost"
                size="sm"
                colorScheme="danger"
                onClick={() => handleRemoveDependency(name)}
                style={{ padding: '2px 6px', minWidth: 'auto' }}
              >
                x
              </Button>
            </Group>
          ))
        )}
      </Stack>
    </div>
  );
}
