import os
import re
import glob

folders = [
    'account-types', 'activity-types', 'bad-words', 'banks', 'banners', 
    'categories', 'cities', 'countries', 'industry-types', 'states'
]

base_dir = '/Users/ahsan-ghalib/Documents/projects/react/soouqlive-frontend/src/app/(protected)/settings'

for folder in folders:
    filepath = os.path.join(base_dir, folder, 'page.jsx')
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Imports
    if 'import TableToolbar' not in content:
        content = re.sub(r'(import { Button } from "@/components/ui/button";)',
                         r'\1\nimport TableToolbar from "@/components/common/table-toolbar";\nimport useDebounce from "@/hooks/useDebounceRef";', 
                         content)

    # 2. State
    if 'const [search, setSearch] = useState("");' not in content:
        content = re.sub(r'(const \[pageSize\] = useState\(50\);)',
                         r'\1\n  const [search, setSearch] = useState("");\n  const debouncedSearch = useDebounce(search, 1000);', 
                         content)

    # 3. fetchData
    if 'params: { page, pageSize },' in content:
        content = content.replace('params: { page, pageSize },', 'params: { page, pageSize, search: debouncedSearch },')
    elif 'params: { page, pageSize, search: debouncedSearch },' not in content:
        # maybe it's multi-line
        content = re.sub(r'params:\s*\{\s*page,\s*pageSize\s*\},', 'params: { page, pageSize, search: debouncedSearch },', content)

    # 4. useEffect dependency
    if '[page, pageSize]' in content:
        content = content.replace('[page, pageSize]', '[page, pageSize, debouncedSearch]')

    # 5. Remove Card imports
    content = re.sub(r'import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";\n', '', content)

    # 6. JSX Transformation
    # We want to replace:
    # <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    #   <div>
    #     <h1 className="text-2xl font-bold">...</h1>
    #     <p className="text-muted-foreground">...</p>
    #   </div>
    #   <Button onClick={openNewDialog} className="gap-2 w-full sm:w-auto">
    #     <Plus className="h-4 w-4" />
    #     Add New
    #   </Button>
    # </div>
    # 
    # <Card>
    #   <CardHeader>
    #     <CardTitle className="text-lg">...</CardTitle>
    #   </CardHeader>
    #   <CardContent>
    #     {loading ? ( ... ) : ... }
    #   </CardContent>
    # </Card>
    
    # Let's use regex to do it robustly:
    
    # 6a. Replace the header section
    header_pattern = r'<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">\s*(<div>.*?</div>)\s*<Button onClick=\{openNewDialog\} className="gap-2 w-full sm:w-auto">\s*<Plus className="h-4 w-4" />\s*Add New\s*</Button>\s*</div>'
    
    replacement_header = r'''<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-4">
          \1
          <div>
            <Button variant="secondary" onClick={openNewDialog} className="w-full md:w-auto mx-2">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>
        
        <TableToolbar
          placeholder="Search items..."
          total={total}
          onSearchChange={(val) => { setPage(1); setSearch(val); }}
          rightSlot={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary font-medium">{total} items found</span>
            </div>
          }
        />'''
    content = re.sub(header_pattern, replacement_header, content, flags=re.DOTALL)

    # 6b. Remove Card wrapper
    content = re.sub(r'<Card>\s*<CardHeader>\s*<CardTitle.*?</CardTitle>\s*</CardHeader>\s*<CardContent>', '', content, flags=re.DOTALL)
    content = re.sub(r'</CardContent>\s*</Card>', '', content, flags=re.DOTALL)

    # Write back
    with open(filepath, 'w') as f:
        f.write(content)

print("Done")
